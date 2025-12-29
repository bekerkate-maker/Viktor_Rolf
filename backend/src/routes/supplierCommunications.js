import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { supabase } from '../database/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../uploads/supplier-comms');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs and documents are allowed'));
    }
  }
});

/**
 * GET /api/supplier-communications
 * Get all supplier communications with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { sample_id, status, supplier_name } = req.query;
    
    let query = supabase
      .from('supplier_communications')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        created_by_user:users!created_by(first_name, last_name)
      `);

    if (sample_id) {
      query = query.eq('sample_id', sample_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (supplier_name) {
      query = query.ilike('supplier_name', `%${supplier_name}%`);
    }

    query = query.order('communication_date', { ascending: false });

    const { data: communications, error } = await query;
    if (error) throw error;

    // Transform data
    const transformedComms = communications.map(sc => ({
      ...sc,
      sample_code: sc.sample?.sample_code,
      sample_name: sc.sample?.name,
      collection_name: sc.sample?.collection?.name,
      created_by_name: sc.created_by_user 
        ? `${sc.created_by_user.first_name} ${sc.created_by_user.last_name}` 
        : null
    }));

    res.json(transformedComms);
  } catch (error) {
    console.error('Error loading supplier communications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/overdue
 * Get communications with overdue deadlines
 */
router.get('/overdue', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdue = db.prepare(`
      SELECT 
        sc.*,
        s.sample_code,
        s.name as sample_name,
        c.name as collection_name,
        (u.first_name || ' ' || u.last_name) as created_by_name
      FROM supplier_communications sc
      LEFT JOIN samples s ON sc.sample_id = s.id
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.status != 'Completed'
        AND (sc.sample_due_date < ? OR sc.feedback_due_date < ?)
      ORDER BY sc.sample_due_date ASC
    `).all(today, today);

    res.json(overdue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/important
 * Get important communications
 */
router.get('/important', (req, res) => {
  try {
    const important = db.prepare(`
      SELECT 
        sc.*,
        s.sample_code,
        s.name as sample_name,
        c.name as collection_name,
        (u.first_name || ' ' || u.last_name) as created_by_name
      FROM supplier_communications sc
      LEFT JOIN samples s ON sc.sample_id = s.id
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.is_important = 1 AND sc.status != 'Completed'
      ORDER BY sc.communication_date DESC
    `).all();

    res.json(important);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/:id
 * Get single supplier communication with attachments
 */
router.get('/:id', (req, res) => {
  try {
    const communication = db.prepare(`
      SELECT 
        sc.*,
        s.sample_code,
        s.name as sample_name,
        c.name as collection_name,
        (u.first_name || ' ' || u.last_name) as created_by_name,
        u.email as created_by_email
      FROM supplier_communications sc
      LEFT JOIN samples s ON sc.sample_id = s.id
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.id = ?
    `).get(req.params.id);

    if (!communication) {
      return res.status(404).json({ error: 'Supplier communication not found' });
    }

    // Get attachments
    const attachments = db.prepare(`
      SELECT * FROM supplier_comm_attachments WHERE supplier_comm_id = ?
      ORDER BY uploaded_at DESC
    `).all(req.params.id);

    communication.attachments = attachments;

    res.json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/supplier-communications
 * Create new supplier communication
 */
router.post('/', (req, res) => {
  try {
    const { 
      sample_id, 
      supplier_name, 
      communication_date, 
      communication_type, 
      summary, 
      sample_due_date, 
      feedback_due_date, 
      status, 
      is_important,
      created_by 
    } = req.body;

    const result = db.prepare(`
      INSERT INTO supplier_communications 
      (sample_id, supplier_name, communication_date, communication_type, summary, sample_due_date, feedback_due_date, status, is_important, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sample_id, 
      supplier_name, 
      communication_date, 
      communication_type, 
      summary, 
      sample_due_date, 
      feedback_due_date, 
      status || 'Waiting for Supplier', 
      is_important || 0,
      created_by
    );

    // Log audit trail
    db.prepare(`
      INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
      VALUES ('supplier_communication', ?, 'created', ?, ?)
    `).run(result.lastInsertRowid, created_by, `Communication logged with ${supplier_name}`);

    const communication = db.prepare('SELECT * FROM supplier_communications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/supplier-communications/:id
 * Update supplier communication
 */
router.put('/:id', (req, res) => {
  try {
    const { 
      supplier_name, 
      communication_date, 
      communication_type, 
      summary, 
      sample_due_date, 
      feedback_due_date, 
      status, 
      is_important,
      user_id
    } = req.body;

    const oldComm = db.prepare('SELECT * FROM supplier_communications WHERE id = ?').get(req.params.id);

    db.prepare(`
      UPDATE supplier_communications 
      SET supplier_name = ?, communication_date = ?, communication_type = ?, summary = ?, 
          sample_due_date = ?, feedback_due_date = ?, status = ?, is_important = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      supplier_name, 
      communication_date, 
      communication_type, 
      summary, 
      sample_due_date, 
      feedback_due_date, 
      status, 
      is_important,
      req.params.id
    );

    // Log status change
    if (oldComm.status !== status && user_id) {
      db.prepare(`
        INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
        VALUES ('supplier_communication', ?, 'status_changed', ?, ?)
      `).run(req.params.id, user_id, `Status changed from "${oldComm.status}" to "${status}"`);
    }

    const communication = db.prepare('SELECT * FROM supplier_communications WHERE id = ?').get(req.params.id);
    res.json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/supplier-communications/:id
 * Delete supplier communication
 */
router.delete('/:id', (req, res) => {
  try {
    // Delete associated attachments from filesystem
    const attachments = db.prepare('SELECT file_path FROM supplier_comm_attachments WHERE supplier_comm_id = ?').all(req.params.id);
    attachments.forEach(att => {
      const fullPath = path.join(__dirname, '../../../', att.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    db.prepare('DELETE FROM supplier_communications WHERE id = ?').run(req.params.id);
    res.json({ message: 'Supplier communication deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/supplier-communications/:id/attachments
 * Upload attachments for supplier communication
 */
router.post('/:id/attachments', upload.array('attachments', 10), (req, res) => {
  try {
    const commId = req.params.id;
    const uploadedAttachments = [];

    req.files.forEach(file => {
      const relativePath = `uploads/supplier-comms/${file.filename}`;
      
      const result = db.prepare(`
        INSERT INTO supplier_comm_attachments (supplier_comm_id, file_path, file_name, file_type)
        VALUES (?, ?, ?, ?)
      `).run(commId, relativePath, file.originalname, file.mimetype);

      uploadedAttachments.push({
        id: result.lastInsertRowid,
        file_path: relativePath,
        file_name: file.originalname,
        file_type: file.mimetype
      });
    });

    res.status(201).json(uploadedAttachments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/supplier-communications/:commId/attachments/:attachmentId
 * Delete an attachment
 */
router.delete('/:commId/attachments/:attachmentId', (req, res) => {
  try {
    const attachment = db.prepare('SELECT file_path FROM supplier_comm_attachments WHERE id = ?').get(req.params.attachmentId);
    
    if (attachment) {
      const fullPath = path.join(__dirname, '../../../', attachment.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    db.prepare('DELETE FROM supplier_comm_attachments WHERE id = ?').run(req.params.attachmentId);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/stats/overview
 * Get overview statistics
 */
router.get('/stats/overview', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      total_communications: db.prepare('SELECT COUNT(*) as count FROM supplier_communications').get().count,
      waiting_for_supplier: db.prepare('SELECT COUNT(*) as count FROM supplier_communications WHERE status = "Waiting for Supplier"').get().count,
      waiting_for_internal: db.prepare('SELECT COUNT(*) as count FROM supplier_communications WHERE status = "Waiting for Internal Feedback"').get().count,
      completed: db.prepare('SELECT COUNT(*) as count FROM supplier_communications WHERE status = "Completed"').get().count,
      overdue_samples: db.prepare('SELECT COUNT(*) as count FROM supplier_communications WHERE sample_due_date < ? AND status != "Completed"').get(today).count,
      important_open: db.prepare('SELECT COUNT(*) as count FROM supplier_communications WHERE is_important = 1 AND status != "Completed"').get().count
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
