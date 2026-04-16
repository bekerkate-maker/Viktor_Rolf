import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { supabase } from '../database/supabase.js';

const __filename = import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

const router = express.Router();

// Configure multer for file uploads (fallback to local, but should use Supabase Storage in production)
const uploadDir = path.join(__dirname, '../../../uploads/supplier-comms');
// Ensure upload directory exists (Only in local development)
try {
  if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }
} catch (err) {
  console.warn('Skipping directory creation in serverless environment:', err.message);
}

const storage = multer.memoryStorage(); // Use memory storage for serverless compatibility
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

/**
 * GET /api/supplier-communications
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

    if (sample_id) query = query.eq('sample_id', sample_id);
    if (status) query = query.eq('status', status);
    if (supplier_name) query = query.ilike('supplier_name', `%${supplier_name}%`);

    query = query.order('communication_date', { ascending: false });

    const { data: communications, error } = await query;
    if (error) throw error;

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
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/overdue
 */
router.get('/overdue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overdue, error } = await supabase
      .from('supplier_communications')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        created_by_user:users!created_by(first_name, last_name)
      `)
      .neq('status', 'Completed')
      .or(`sample_due_date.lt.${today},feedback_due_date.lt.${today}`)
      .order('sample_due_date', { ascending: true });

    if (error) throw error;

    const transformed = overdue.map(sc => ({
      ...sc,
      sample_code: sc.sample?.sample_code,
      sample_name: sc.sample?.name,
      collection_name: sc.sample?.collection?.name,
      created_by_name: sc.created_by_user ? `${sc.created_by_user.first_name} ${sc.created_by_user.last_name}` : null
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/important
 */
router.get('/important', async (req, res) => {
  try {
    const { data: important, error } = await supabase
      .from('supplier_communications')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        created_by_user:users!created_by(first_name, last_name)
      `)
      .eq('is_important', true)
      .neq('status', 'Completed')
      .order('communication_date', { ascending: false });

    if (error) throw error;

    const transformed = important.map(sc => ({
      ...sc,
      sample_code: sc.sample?.sample_code,
      sample_name: sc.sample?.name,
      collection_name: sc.sample?.collection?.name,
      created_by_name: sc.created_by_user ? `${sc.created_by_user.first_name} ${sc.created_by_user.last_name}` : null
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: communication, error } = await supabase
      .from('supplier_communications')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        created_by_user:users!created_by(first_name, last_name, email),
        attachments:supplier_comm_attachments(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({
      ...communication,
      sample_code: communication.sample?.sample_code,
      sample_name: communication.sample?.name,
      collection_name: communication.sample?.collection?.name,
      created_by_name: communication.created_by_user ? `${communication.created_by_user.first_name} ${communication.created_by_user.last_name}` : null,
      created_by_email: communication.created_by_user?.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/supplier-communications
 */
router.post('/', async (req, res) => {
  try {
    const { 
      sample_id, supplier_name, communication_date, communication_type, 
      summary, sample_due_date, feedback_due_date, status, is_important, created_by 
    } = req.body;

    const { data: communication, error } = await supabase
      .from('supplier_communications')
      .insert({
        sample_id, supplier_name, communication_date, communication_type, 
        summary, sample_due_date, feedback_due_date, 
        status: status || 'Waiting for Supplier', 
        is_important: is_important || false,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from('audit_trail').insert({
      entity_type: 'supplier_communication',
      entity_id: communication.id,
      action: 'created',
      user_id: created_by,
      changes: `Communication logged with ${supplier_name}`
    });

    res.status(201).json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/supplier-communications/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { 
      supplier_name, communication_date, communication_type, summary, 
      sample_due_date, feedback_due_date, status, is_important, user_id
    } = req.body;

    const { data: oldComm, error: fetchError } = await supabase
      .from('supplier_communications')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    const { data: communication, error } = await supabase
      .from('supplier_communications')
      .update({
        supplier_name, communication_date, communication_type, summary, 
        sample_due_date, feedback_due_date, status, is_important, updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (oldComm.status !== status && user_id) {
      await supabase.from('audit_trail').insert({
        entity_type: 'supplier_communication',
        entity_id: req.params.id,
        action: 'status_changed',
        user_id: user_id,
        changes: `Status changed from "${oldComm.status}" to "${status}"`
      });
    }

    res.json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/supplier-communications/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('supplier_communications')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Supplier communication deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/supplier-communications/stats/overview
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { count: total } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true });
    const { count: waitingSupplier } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true }).eq('status', 'Waiting for Supplier');
    const { count: waitingInternal } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true }).eq('status', 'Waiting for Internal Feedback');
    const { count: completed } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true }).eq('status', 'Completed');
    const { count: overdue } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true }).lt('sample_due_date', today).neq('status', 'Completed');
    const { count: important } = await supabase.from('supplier_communications').select('*', { count: 'exact', head: true }).eq('is_important', true).neq('status', 'Completed');

    res.json({
      total_communications: total || 0,
      waiting_for_supplier: waitingSupplier || 0,
      waiting_for_internal: waitingInternal || 0,
      completed: completed || 0,
      overdue_samples: overdue || 0,
      important_open: important || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
