import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users
 */
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY name
    `).all();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', (req, res) => {
  try {
    const { name, email, role } = req.body;

    const result = db.prepare(`
      INSERT INTO users (name, email, role)
      VALUES (?, ?, ?)
    `).run(name, email, role || 'editor');

    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', (req, res) => {
  try {
    const { name, email, role } = req.body;

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?
      WHERE id = ?
    `).run(name, email, role, req.params.id);

    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
