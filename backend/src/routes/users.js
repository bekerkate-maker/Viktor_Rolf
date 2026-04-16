import express from 'express';
import { supabase } from '../database/supabase.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .order('first_name');

    if (error) throw error;

    // Transform for frontend compatibility (name instead of first/last)
    const transformedUsers = users.map(u => ({
      ...u,
      name: `${u.first_name} ${u.last_name}`.trim()
    }));

    res.json(transformedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
      throw error;
    }

    res.json({
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    // Simple split for compatibility, though first/last is better
    const names = name ? name.split(' ') : ['', ''];
    const first_name = names[0];
    const last_name = names.slice(1).join(' ');

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        first_name,
        last_name,
        role: role || 'editor'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const names = name ? name.split(' ') : ['', ''];
    const first_name = names[0];
    const last_name = names.slice(1).join(' ');

    const { data: user, error } = await supabase
      .from('users')
      .update({
        email,
        first_name,
        last_name,
        role
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
