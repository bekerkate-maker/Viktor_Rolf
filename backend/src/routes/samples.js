import express from 'express';
import { supabase } from '../database/supabase.js';

const router = express.Router();

/**
 * GET /api/samples
 * Get all samples with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { collection_id, status } = req.query;
    
    let query = supabase
      .from('samples')
      .select(`
        *,
        collection:collections(name, season, year, category),
        responsible_user:users!responsible_user_id(first_name, last_name, email),
        quality_reviews(id),
        supplier_communications(id)
      `);

    if (collection_id) {
      query = query.eq('collection_id', collection_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

  // Sorteer op sample_code oplopend zodat 1 bovenaan staat
  query = query.order('sample_code', { ascending: true });

    const { data: samples, error } = await query;

    if (error) throw error;

    // Transform data to match old structure
    const transformedSamples = samples.map(s => ({
      ...s,
      collection_name: s.collection?.name,
      season: s.collection?.season,
      year: s.collection?.year,
      collection_type: s.collection?.category,
      responsible_user_name: s.responsible_user 
        ? `${s.responsible_user.first_name} ${s.responsible_user.last_name}` 
        : null,
      quality_review_count: s.quality_reviews?.length || 0,
      supplier_comm_count: s.supplier_communications?.length || 0
    }));

    res.json(transformedSamples);
  } catch (error) {
    console.error('Error loading samples:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/samples/:id
 * Get single sample with full details
 */
router.get('/:id', async (req, res) => {
  try {
    // Get sample with related data
    const { data: sample, error } = await supabase
      .from('samples')
      .select(`
        *,
        collection:collections(name, season, year, category),
        responsible_user:users!responsible_user_id(first_name, last_name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Sample not found' });
      }
      throw error;
    }

    // Get quality reviews (and add sample_round from parent sample)
    const { data: qualityReviews, error: qrError } = await supabase
      .from('quality_reviews')
      .select(`
        *,
        reviewer:users!reviewer_id(first_name, last_name, email)
      `)
      .eq('sample_id', req.params.id)
      .order('created_at', { ascending: false });

    if (qrError) throw qrError;

    // Get sample_round from parent sample (already fetched as 'sample')
    const sampleRound = sample.sample_round;
    // Add sample_round to each review
    const qualityReviewsWithRound = qualityReviews.map(qr => ({ ...qr, sample_round: sampleRound }));

    // Get supplier communications
    const { data: supplierComms, error: scError } = await supabase
      .from('supplier_communications')
      .select(`
        *,
        created_by_user:users!created_by(first_name, last_name)
      `)
      .eq('sample_id', req.params.id)
      .order('communication_date', { ascending: false });

    if (scError) throw scError;

    // Get audit trail
    const { data: auditTrail, error: atError } = await supabase
      .from('audit_trail')
      .select(`
        *,
        user:users(first_name, last_name)
      `)
      .eq('entity_type', 'sample')
      .eq('entity_id', req.params.id)
      .order('created_at', { ascending: false });

    if (atError) throw atError;

    // Transform data to match old structure
    const transformedSample = {
      ...sample,
      collection_name: sample.collection?.name,
      season: sample.collection?.season,
      year: sample.collection?.year,
      collection_type: sample.collection?.category,
      responsible_user_name: sample.responsible_user 
        ? `${sample.responsible_user.first_name} ${sample.responsible_user.last_name}` 
        : null,
      responsible_user_email: sample.responsible_user?.email,
      quality_reviews: qualityReviewsWithRound.map(qr => ({
        ...qr,
        reviewer_name: qr.reviewer 
          ? `${qr.reviewer.first_name} ${qr.reviewer.last_name}` 
          : null,
        reviewer_email: qr.reviewer?.email
      })),
      supplier_communications: supplierComms.map(sc => ({
        ...sc,
        created_by_name: sc.created_by_user 
          ? `${sc.created_by_user.first_name} ${sc.created_by_user.last_name}` 
          : null
      })),
      audit_trail: auditTrail.map(at => ({
        ...at,
        user_name: at.user 
          ? `${at.user.first_name} ${at.user.last_name}` 
          : null
      }))
    };

    res.json(transformedSample);
  } catch (error) {
    console.error('Error loading sample:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/samples
 * Create new sample
 */
router.post('/', async (req, res) => {
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

    const { data: sample, error } = await supabase
      .from('samples')
      .insert({
        collection_id, 
        sample_code, 
        name, 
        sample_round: sample_round || 'Proto',
        product_type: product_type || 'Other',
        supplier_name: supplier_name || '',
        status: status || 'In Review', 
        responsible_user_id,
        received_date: received_date || null,
        feedback_deadline: feedback_deadline || null,
        internal_notes: internal_notes || '',
        tags: tags || ''
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    if (responsible_user_id) {
      await supabase
        .from('audit_trail')
        .insert({
          entity_type: 'sample',
          entity_id: sample.id,
          action: 'created',
          user_id: responsible_user_id,
          changes: `Sample ${sample_code} created`
        });
    }

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
router.put('/:id', async (req, res) => {
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
    
    // Get old sample for audit trail
    const { data: oldSample, error: fetchError } = await supabase
      .from('samples')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !oldSample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Update sample
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sample_round !== undefined) updateData.sample_round = sample_round;
    if (product_type !== undefined) updateData.product_type = product_type;
    if (supplier_name !== undefined) updateData.supplier_name = supplier_name;
    if (status !== undefined) updateData.status = status;
    if (responsible_user_id !== undefined) updateData.responsible_user_id = responsible_user_id;
    if (received_date !== undefined) updateData.received_date = received_date;
    if (feedback_deadline !== undefined) updateData.feedback_deadline = feedback_deadline;
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (tags !== undefined) updateData.tags = tags;

    const { data: sample, error: updateError } = await supabase
      .from('samples')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log status change in audit trail
    if (oldSample.status !== status && (user_id || responsible_user_id)) {
      await supabase
        .from('audit_trail')
        .insert({
          entity_type: 'sample',
          entity_id: req.params.id,
          action: 'status_changed',
          user_id: user_id || responsible_user_id,
          changes: `Status changed from "${oldSample.status}" to "${status}"`
        });
    }

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
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('samples')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Sample deleted successfully' });
  } catch (error) {
    console.error('Error deleting sample:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/samples/:id/audit-trail
 * Get audit trail for a sample
 */
router.get('/:id/audit-trail', async (req, res) => {
  try {
    // Get quality review IDs for this sample
    const { data: qualityReviews } = await supabase
      .from('quality_reviews')
      .select('id')
      .eq('sample_id', req.params.id);

    const qualityReviewIds = qualityReviews?.map(qr => qr.id) || [];

    // Get supplier communication IDs for this sample
    const { data: supplierComms } = await supabase
      .from('supplier_communications')
      .select('id')
      .eq('sample_id', req.params.id);

    const supplierCommIds = supplierComms?.map(sc => sc.id) || [];

    // Get audit trail entries
    let query = supabase
      .from('audit_trail')
      .select(`
        *,
        user:users(first_name, last_name, email)
      `);

    // Build OR filter for all related entities
    const orFilters = [`and(entity_type.eq.sample,entity_id.eq.${req.params.id})`];
    
    if (qualityReviewIds.length > 0) {
      orFilters.push(`and(entity_type.eq.quality_review,entity_id.in.(${qualityReviewIds.join(',')}))`);
    }
    
    if (supplierCommIds.length > 0) {
      orFilters.push(`and(entity_type.eq.supplier_communication,entity_id.in.(${supplierCommIds.join(',')}))`);
    }

    query = query.or(orFilters.join(','));
    query = query.order('created_at', { ascending: false });

    const { data: auditTrail, error } = await query;

    if (error) throw error;

    // Transform data
    const transformedAuditTrail = auditTrail.map(at => ({
      ...at,
      user_name: at.user 
        ? `${at.user.first_name} ${at.user.last_name}` 
        : null,
      user_email: at.user?.email
    }));

    res.json(transformedAuditTrail);
  } catch (error) {
    console.error('Error loading audit trail:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
