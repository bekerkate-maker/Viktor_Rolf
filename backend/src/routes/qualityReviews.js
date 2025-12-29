import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../uploads/quality-reviews');

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
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

/**
 * GET /api/quality-reviews
 * Get all quality reviews with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { sample_id, status, severity } = req.query;
    
    let query = `
      SELECT 
        qr.*,
        s.sample_code,
        s.name as sample_name,
        c.name as collection_name,
        (u.first_name || ' ' || u.last_name) as reviewer_name
      FROM quality_reviews qr
      LEFT JOIN samples s ON qr.sample_id = s.id
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON qr.reviewer_id = u.id
      WHERE 1=1
    `;

    const params = [];
    
    if (sample_id) {
      query += ' AND qr.sample_id = ?';
      params.push(sample_id);
    }
    
    if (status) {
      query += ' AND qr.status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND qr.severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY qr.created_at DESC';

    const reviews = db.prepare(query).all(...params);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quality-reviews/:id
 * Get single quality review with photos and comments
 */
router.get('/:id', (req, res) => {
  try {
    const review = db.prepare(`
      SELECT 
        qr.*,
        s.sample_code,
        s.name as sample_name,
        c.name as collection_name,
        (u.first_name || ' ' || u.last_name) as reviewer_name,
        u.email as reviewer_email
      FROM quality_reviews qr
      LEFT JOIN samples s ON qr.sample_id = s.id
      LEFT JOIN collections c ON s.collection_id = c.id
      LEFT JOIN users u ON qr.reviewer_id = u.id
      WHERE qr.id = ?
    `).get(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Quality review not found' });
    }

    // Get photos
    const photos = db.prepare(`
      SELECT * FROM quality_review_photos WHERE quality_review_id = ?
      ORDER BY uploaded_at DESC
    `).all(req.params.id);

    // Get comments
    const comments = db.prepare(`
      SELECT 
        qrc.*,
        (u.first_name || ' ' || u.last_name) as user_name,
        u.email as user_email
      FROM quality_review_comments qrc
      LEFT JOIN users u ON qrc.user_id = u.id
      WHERE qrc.quality_review_id = ?
      ORDER BY qrc.created_at ASC
    `).all(req.params.id);

    review.photos = photos;
    review.comments = comments;

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews
 * Create new quality review
 */
router.post('/', (req, res) => {
  try {
    const { sample_id, reviewer_id, issue_type, issue_description, severity, action_points, status } = req.body;

    const result = db.prepare(`
      INSERT INTO quality_reviews (sample_id, reviewer_id, issue_type, issue_description, severity, action_points, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sample_id, reviewer_id, issue_type, issue_description, severity, action_points, status || 'Pending Review');

    // Update sample status if needed
    db.prepare(`
      UPDATE samples SET status = 'Review Needed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(sample_id);

    // Log audit trail
    db.prepare(`
      INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
      VALUES ('quality_review', ?, 'created', ?, ?)
    `).run(result.lastInsertRowid, reviewer_id, `Quality review created: ${issue_type}`);

    const review = db.prepare('SELECT * FROM quality_reviews WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/quality-reviews/:id
 * Update quality review
 */
router.put('/:id', (req, res) => {
  try {
    const { issue_type, issue_description, severity, action_points, status, user_id } = req.body;

    const oldReview = db.prepare('SELECT * FROM quality_reviews WHERE id = ?').get(req.params.id);

    db.prepare(`
      UPDATE quality_reviews 
      SET issue_type = ?, issue_description = ?, severity = ?, action_points = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(issue_type, issue_description, severity, action_points, status, req.params.id);

    // Log status change
    if (oldReview.status !== status && user_id) {
      db.prepare(`
        INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes)
        VALUES ('quality_review', ?, 'status_changed', ?, ?)
      `).run(req.params.id, user_id, `Status changed from "${oldReview.status}" to "${status}"`);
    }

    const review = db.prepare('SELECT * FROM quality_reviews WHERE id = ?').get(req.params.id);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/quality-reviews/:id
 * Delete quality review
 */
router.delete('/:id', (req, res) => {
  try {
    // Delete associated photos from filesystem
    const photos = db.prepare('SELECT file_path FROM quality_review_photos WHERE quality_review_id = ?').all(req.params.id);
    photos.forEach(photo => {
      const fullPath = path.join(__dirname, '../../../', photo.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    db.prepare('DELETE FROM quality_reviews WHERE id = ?').run(req.params.id);
    res.json({ message: 'Quality review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews/:id/photos
 * Upload photos for quality review
 */
router.post('/:id/photos', upload.array('photos', 10), (req, res) => {
  try {
    const reviewId = req.params.id;
    const uploadedPhotos = [];

    req.files.forEach(file => {
      const relativePath = `uploads/quality-reviews/${file.filename}`;
      
      const result = db.prepare(`
        INSERT INTO quality_review_photos (quality_review_id, file_path, file_name)
        VALUES (?, ?, ?)
      `).run(reviewId, relativePath, file.originalname);

      uploadedPhotos.push({
        id: result.lastInsertRowid,
        file_path: relativePath,
        file_name: file.originalname
      });
    });

    res.status(201).json(uploadedPhotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/quality-reviews/:reviewId/photos/:photoId
 * Delete a photo
 */
router.delete('/:reviewId/photos/:photoId', (req, res) => {
  try {
    const photo = db.prepare('SELECT file_path FROM quality_review_photos WHERE id = ?').get(req.params.photoId);
    
    if (photo) {
      const fullPath = path.join(__dirname, '../../../', photo.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    db.prepare('DELETE FROM quality_review_photos WHERE id = ?').run(req.params.photoId);
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews/:id/comments
 * Add comment to quality review
 */
router.post('/:id/comments', (req, res) => {
  try {
    const { user_id, comment } = req.body;

    const result = db.prepare(`
      INSERT INTO quality_review_comments (quality_review_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(req.params.id, user_id, comment);

    const newComment = db.prepare(`
      SELECT 
        qrc.*,
        (u.first_name || ' ' || u.last_name) as user_name,
        u.email as user_email
      FROM quality_review_comments qrc
      LEFT JOIN users u ON qrc.user_id = u.id
      WHERE qrc.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quality-reviews/stats/overview
 * Get overview statistics for quality reviews
 */
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      total_reviews: db.prepare('SELECT COUNT(*) as count FROM quality_reviews').get().count,
      pending_review: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE status = "Pending Review"').get().count,
      changes_requested: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE status = "Changes Requested"').get().count,
      approved: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE status = "Approved"').get().count,
      high_severity: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE severity = "High"').get().count,
      medium_severity: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE severity = "Medium"').get().count,
      low_severity: db.prepare('SELECT COUNT(*) as count FROM quality_reviews WHERE severity = "Low"').get().count
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
