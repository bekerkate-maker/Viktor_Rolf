import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

/**
 * GET /api/collections
 * Get all collections with sample counts
 */
router.get('/', (req, res) => {
  try {
    const collections = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as sample_count,
        SUM(CASE WHEN s.status = 'In Review' THEN 1 ELSE 0 END) as in_review_count,
        SUM(CASE WHEN s.status = 'Changes Needed' THEN 1 ELSE 0 END) as changes_needed_count,
        SUM(CASE WHEN s.status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN s.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM collections c
      LEFT JOIN samples s ON c.id = s.collection_id
      GROUP BY c.id
      ORDER BY c.year DESC, c.season DESC
    `).all();

    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/collections/:id
 * Get single collection with details
 */
router.get('/:id', (req, res) => {
  try {
    const collection = db.prepare(`
      SELECT * FROM collections WHERE id = ?
    `).get(req.params.id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Get samples for this collection
    const samples = db.prepare(`
      SELECT 
        s.*,
        (u.first_name || ' ' || u.last_name) as responsible_user_name,
        COUNT(DISTINCT qr.id) as quality_review_count
      FROM samples s
      LEFT JOIN users u ON s.responsible_user_id = u.id
      LEFT JOIN quality_reviews qr ON s.id = qr.sample_id
      WHERE s.collection_id = ?
      GROUP BY s.id
      ORDER BY s.sample_code
    `).all(req.params.id);

    collection.samples = samples;
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/collections
 * Create new collection
 */
router.post('/', (req, res) => {
  try {
    const { name, season, year, type } = req.body;

    const result = db.prepare(`
      INSERT INTO collections (name, season, year, type)
      VALUES (?, ?, ?, ?)
    `).run(name, season, year, type);

    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/collections/:id
 * Update collection
 */
router.put('/:id', (req, res) => {
  try {
    const { name, season, year, type, status } = req.body;

    db.prepare(`
      UPDATE collections 
      SET name = ?, season = ?, year = ?, type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, season, year, type, status, req.params.id);

    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete collection (and cascade samples)
 */
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
