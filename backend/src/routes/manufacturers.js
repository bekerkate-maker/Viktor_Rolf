import express from 'express';
import { supabase } from '../database/supabase.js';

const router = express.Router();

/**
 * GET /api/manufacturers
 * Get all manufacturers
 */
router.get('/', async (req, res) => {
  try {
    // 1. Get existing managed manufacturers
    let { data: manufacturers, error } = await supabase
      .from('manufacturers')
      .select('*')
      .order('name', { ascending: true });

    const tableMissing = error && (
      error.code === '42P01' || 
      error.message?.includes('does not exist') || 
      error.message?.includes('schema cache')
    );
    if (error && !tableMissing) throw error;
    
    manufacturers = manufacturers || [];

    // 2. Get unique manufacturers from samples
    const { data: samplesResponse, error: sampleError } = await supabase
      .from('samples')
      .select('supplier_name');
    
    if (sampleError) throw sampleError;
    
    const samples = samplesResponse || [];
    const uniqueSampleNames = [...new Set(samples.map(s => s.supplier_name).filter(Boolean))].sort();

    if (tableMissing) {
      console.log('Manufacturers table is missing in Supabase, returning names from samples only.');
      return res.json(uniqueSampleNames.map((name, index) => ({ id: `temp-${index}`, name })));
    }

    const existingNames = new Set(manufacturers.map(m => m.name));
    
    // 3. Find missing manufacturers and insert them
    const missingNames = uniqueSampleNames.filter(name => !existingNames.has(name));
    
    if (missingNames.length > 0) {
      console.log('Syncing missing manufacturers to Supabase:', missingNames);
      const { error: insertError } = await supabase
        .from('manufacturers')
        .insert(missingNames.map(name => ({ name })));
      
      if (!insertError) {
        // Fetch again after sync
        const { data: refreshed } = await supabase
          .from('manufacturers')
          .select('*')
          .order('name', { ascending: true });
        if (refreshed) manufacturers = refreshed;
      }
    }

    res.json(manufacturers);
  } catch (error) {
    console.error('Error loading manufacturers from Supabase:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/manufacturers
 * Add new manufacturer
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await supabase
      .from('manufacturers')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding manufacturer to Supabase:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/manufacturers/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('manufacturers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting manufacturer from Supabase:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/manufacturers/:id
 * Update manufacturer name
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, oldName: providedOldName } = req.body;
    const { id } = req.params;

    let oldName = providedOldName || '';

    if (!id.toString().startsWith('temp-')) {
      // 1. Get the current name before updating
      const { data: current, error: fetchError } = await supabase
        .from('manufacturers')
        .select('name')
        .eq('id', id)
        .single();

      if (!fetchError && current) {
        oldName = current.name;
        
        // 2. Update the manufacturer entry
        const { error } = await supabase
          .from('manufacturers')
          .update({ name })
          .eq('id', id);
        if (error) throw error;
      }
    }

    // 3. Update all samples that used the old name
    if (oldName && oldName !== name) {
      console.log(`Renaming all samples from "${oldName}" to "${name}" in Supabase`);
      const { error: updateSamplesError } = await supabase
        .from('samples')
        .update({ supplier_name: name })
        .eq('supplier_name', oldName);
      
      if (updateSamplesError) {
        console.error('Failed to update manufacturers in samples:', updateSamplesError);
      }
    }

    res.json({ id, name });
  } catch (error) {
    console.error('Error updating manufacturer in Supabase:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
