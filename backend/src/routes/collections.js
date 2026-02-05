import express from 'express';
import { supabase } from '../database/supabase.js';

const router = express.Router();

/**
 * GET /api/collections
 * Get all collections with sample counts
 */
router.get('/', async (req, res) => {
  try {
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        season,
        year,
        category,
        status,
        created_at,
        updated_at,
        samples(id, status)
      `)
      .order('year', { ascending: false })
      .order('season', { ascending: false });

    if (error) throw error;

    // Safety check: ensure collections is an array
    const collectionsToProcess = collections || [];

    // Auto-fix: if category is missing, try to infer it from the name for the response
    const collectionsWithFixedCategories = collectionsToProcess.map(c => {
      let category = c.category;
      if (!category && c.name) {
        const name = c.name.toLowerCase();
        if (name.includes('ready to wear') || name.includes('rtw')) category = 'Ready to Wear';
        else if (name.includes('couture')) category = 'Haute Couture';
        else if (name.includes('mariage')) category = 'Mariage';
      }
      return { ...c, category };
    });

    // Filter out collections missing category and log a warning
    const validCollections = collectionsWithFixedCategories.filter(c => {
      if (!c.category) {
        console.warn('Collection missing category:', c);
        return false;
      }
      return true;
    });

    // Calculate counts for each valid collection
    const collectionsWithCounts = validCollections.map(c => ({
      ...c,
      sample_count: c.samples?.length || 0,
      in_review_count: c.samples?.filter(s => s.status === 'In Review').length || 0,
      changes_needed_count: c.samples?.filter(s => s.status === 'Changes Needed').length || 0,
      approved_count: c.samples?.filter(s => s.status === 'Approved').length || 0,
      rejected_count: c.samples?.filter(s => s.status === 'Rejected').length || 0
    }));

    res.json(collectionsWithCounts);
  } catch (error) {
    console.error('Error loading collections:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/collections/:id
 * Get single collection with details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Collection not found' });
      }
      throw error;
    }

    // Get samples for this collection
    const { data: samples, error: samplesError } = await supabase
      .from('samples')
      .select(`
        *,
        responsible_user:users!responsible_user_id(first_name, last_name),
        quality_reviews(id)
      `)
      .eq('collection_id', req.params.id)
      .order('sample_code');

    if (samplesError) throw samplesError;

    // Transform samples
    collection.samples = samples.map(s => ({
      ...s,
      responsible_user_name: s.responsible_user
        ? `${s.responsible_user.first_name} ${s.responsible_user.last_name}`
        : null,
      quality_review_count: s.quality_reviews?.length || 0
    }));

    res.json(collection);
  } catch (error) {
    console.error('Error loading collection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/collections
 * Create new collection
 */
router.post('/', async (req, res) => {
  try {
    const { name, season, year, type, category, status } = req.body;

    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        name,
        season,
        year,
        category: category || type,
        status: status || 'Active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/collections/:id
 * Update collection
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, season, year, type, status } = req.body;

    const { data: collection, error } = await supabase
      .from('collections')
      .update({ name, season, year, type, status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete collection (and cascade samples)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
