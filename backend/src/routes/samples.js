import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

/**
 * GET /api/samples
 * Get all samples with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { collection_id, status } = req.query;
    
    let query = `
      SELECT 
        s.*,
        c.name as collection_name,
        c.season,
        c.year,
        (u.first_name || ' ' || u.last_name) as responsible_user_name,
        COUNT(DISTINCT qr.id) as quality_review_count,
        COUNT(DISTINCT sc.id) as supplier_comm_count
      FROM samples s
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON s.responsible_user_id = u.id
      LEFT JOIN quality_reviews qr ON s.id = qr.sample_id
      LEFT JOIN supplier_communications sc ON s.id = sc.sample_id
      WHERE 1=1
    `;

    const params = [];
    
    if (collection_id) {
      query += ' AND s.collection_id = ?';
      params.push(collection_id);
    }
    
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' GROUP BY s.id ORDER BY s.updated_at DESC';

    const samples = db.prepare(query).all(...params);
    res.json(samples);
  } catch (error) {
    console.error('Error loading samples:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/samples/:id
 * Get single sample with full details
 */
router.get('/:id', (req, res) => {
  try {
    const sample = db.prepare(`
      SELECT 
        s.*,
        c.name as collection_name,
        c.season,
        c.year,
        c.type as collection_type,
        (u.first_name || ' ' || u.last_name) as responsible_user_name,
        u.email as responsible_user_email
      FROM samples s
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON s.responsible_user_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Get quality reviews
    const qualityReviews = db.prepare(`
      SELECT 
        qr.*,
        (u.first_name || ' ' || u.last_name) as reviewer_name,
        u.email as reviewer_email
      FROM quality_reviews qr
      LEFT JOIN users u ON qr.reviewer_id = u.id
      WHERE qr.sample_id = ?
      ORDER BY qr.created_at DESC
    `).all(req.params.id);

    // Get supplier communications
    const supplierComms = db.prepare(`
      SELECT 
        sc.*,
        (u.first_name || ' ' || u.last_name) as created_by_name
      FROM supplier_communications sc
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.sample_id = ?
      ORDER BY sc.communication_date DESC
    `).all(req.params.id);

    // Get audit trail
    const auditTrail = db.prepare(`
      SELECT 
        at.*,
        (u.first_name || ' ' || u.last_name) as user_name
      FROM audit_trail at
      LEFT JOIN users u ON at.user_id = u.id
      WHERE at.entity_type = 'sample' AND at.entity_id = ?
      ORDER BY at.created_at DESC
    `).all(req.params.id);

    sample.quality_reviews = qualityReviews;
    sample.supplier_communications = supplierComms;
    sample.audit_trail = auditTrail;

    res.json(sample);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/samples
 * Create new sample
 */
router.post('/', (req, res) => {
  try {
    const { 
      collection_id, 
      sample_code, 
      name, 
      sample_round,
      product_type,
      supplier_name,
      status, 
      responsible_user_id,
      received_date,
      feedback_deadline,
      internal_notes,
      tags
    } = req.body;

    console.log('Received sample creation request:', {
      collection_id,
      sample_code,
      responsible_user_id,
      name
    });

    const result = db.prepare(`
      INSERT INTO samples (
        collection_id, 
        sample_code, 
        name, 
        sample_round,
        product_type,
        supplier_name,
        status, 
        responsible_user_id,
        received_date,
        feedback_deadline,
        internal_notes,
        tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      collection_id, 
      sample_code, 
      name, 
      sample_round || 'Proto',
      product_type || 'Other',
      supplier_name || '',
      status || 'In Review', 
      responsible_user_id,
      received_date || null,
      feedback_deadline || null,
      internal_notes || '',
      tags || ''
    );

    // Log audit trail
    if (responsible_user_id) {
      db.prepare(`
        INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
        VALUES ('sample', ?, 'created', ?, ?)
      `).run(result.lastInsertRowid, responsible_user_id, `Sample ${sample_code} created`);
    }

    const sample = db.prepare('SELECT * FROM samples WHERE id = ?').get(result.lastInsertRowid);
    console.log('Sample created successfully:', sample.id);
    res.status(201).json(sample);
  } catch (error) {
    console.error('Error creating sample:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/samples/:id
 * Update sample
 */
router.put('/:id', (req, res) => {
  try {
    const { 
      name, 
      sample_round,
      product_type,
      supplier_name,
      status, 
      responsible_user_id,
      received_date,
      feedback_deadline,
      internal_notes,
      tags,
      user_id 
    } = req.body;
    
    const oldSample = db.prepare('SELECT * FROM samples WHERE id = ?').get(req.params.id);
    
    if (!oldSample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    db.prepare(`
      UPDATE samples 
      SET 
        name = ?,
        sample_round = ?,
        product_type = ?,
        supplier_name = ?,
        status = ?,
        responsible_user_id = ?,
        received_date = ?,
        feedback_deadline = ?,
        internal_notes = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || oldSample.name,
      sample_round || oldSample.sample_round,
      product_type || oldSample.product_type,
      supplier_name !== undefined ? supplier_name : oldSample.supplier_name,
      status || oldSample.status,
      responsible_user_id || oldSample.responsible_user_id,
      received_date !== undefined ? received_date : oldSample.received_date,
      feedback_deadline !== undefined ? feedback_deadline : oldSample.feedback_deadline,
      internal_notes !== undefined ? internal_notes : oldSample.internal_notes,
      tags !== undefined ? tags : oldSample.tags,
      req.params.id
    );

    // Log status change in audit trail
    if (oldSample.status !== status && (user_id || responsible_user_id)) {
      db.prepare(`
        INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
        VALUES ('sample', ?, 'status_changed', ?, ?)
      `).run(
        req.params.id, 
        user_id || responsible_user_id, 
        `Status changed from "${oldSample.status}" to "${status}"`
      );
    }

    const sample = db.prepare('SELECT * FROM samples WHERE id = ?').get(req.params.id);
    console.log('Sample updated successfully:', sample.id);
    res.json(sample);
  } catch (error) {
    console.error('Error updating sample:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/samples/:id
 * Delete sample
 */
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM samples WHERE id = ?').run(req.params.id);
    res.json({ message: 'Sample deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/samples/:id/audit-trail
 * Get audit trail for a sample
 */
router.get('/:id/audit-trail', (req, res) => {
  try {
    const auditTrail = db.prepare(`
      SELECT 
        at.*,
        (u.first_name || ' ' || u.last_name) as user_name,
        u.email as user_email
      FROM audit_trail at
      LEFT JOIN users u ON at.user_id = u.id
      WHERE (at.entity_type = 'sample' AND at.entity_id = ?)
         OR (at.entity_type = 'quality_review' AND at.entity_id IN (
           SELECT id FROM quality_reviews WHERE sample_id = ?
         ))
         OR (at.entity_type = 'supplier_communication' AND at.entity_id IN (
           SELECT id FROM supplier_communications WHERE sample_id = ?
         ))
      ORDER BY at.created_at DESC
    `).all(req.params.id, req.params.id, req.params.id);

    res.json(auditTrail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
