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
router.get('/', async (req, res) => {
  try {
    const { sample_id, status, severity } = req.query;
    
    let query = supabase
      .from('quality_reviews')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        reviewer:users!reviewer_id(first_name, last_name)
      `);

    if (sample_id) {
      query = query.eq('sample_id', sample_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    query = query.order('created_at', { ascending: false });

    const { data: reviews, error } = await query;
    if (error) throw error;

    // Transform data
    const transformedReviews = reviews.map(r => ({
      ...r,
      sample_code: r.sample?.sample_code,
      sample_name: r.sample?.name,
      collection_name: r.sample?.collection?.name,
      reviewer_name: r.reviewer 
        ? `${r.reviewer.first_name} ${r.reviewer.last_name}` 
        : null
    }));

    res.json(transformedReviews);
  } catch (error) {
    console.error('Error loading quality reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quality-reviews/:id
 * Get single quality review with photos and comments
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: review, error } = await supabase
      .from('quality_reviews')
      .select(`
        *,
        sample:samples(sample_code, name, collection:collections(name)),
        reviewer:users!reviewer_id(first_name, last_name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Quality review not found' });
      }
      throw error;
    }

    // Get photos
    const { data: photos, error: photosError } = await supabase
      .from('quality_review_photos')
      .select('*')
      .eq('quality_review_id', req.params.id)
      .order('uploaded_at', { ascending: false });

    if (photosError) throw photosError;

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('quality_review_comments')
      .select(`
        *,
        user:users(first_name, last_name, email)
      `)
      .eq('quality_review_id', req.params.id)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    // Transform data
    const transformedReview = {
      ...review,
      sample_code: review.sample?.sample_code,
      sample_name: review.sample?.name,
      collection_name: review.sample?.collection?.name,
      reviewer_name: review.reviewer 
        ? `${review.reviewer.first_name} ${review.reviewer.last_name}` 
        : null,
      reviewer_email: review.reviewer?.email,
      photos: photos || [],
      comments: comments?.map(c => ({
        ...c,
        user_name: c.user ? `${c.user.first_name} ${c.user.last_name}` : null,
        user_email: c.user?.email
      })) || []
    };

    res.json(transformedReview);
  } catch (error) {
    console.error('Error loading quality review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews
 * Create new quality review
 */
router.post('/', async (req, res) => {
  try {
    const { sample_id, reviewer_id, issue_type, issue_description, severity, action_points, status } = req.body;

    const { data: review, error } = await supabase
      .from('quality_reviews')
      .insert({
        sample_id,
        reviewer_id,
        issue_type,
        issue_description,
        severity,
        action_points,
        status: status || 'Pending Review'
      })
      .select()
      .single();

    if (error) throw error;

    // Update sample status if needed
    await supabase
      .from('samples')
      .update({ status: 'Review Needed' })
      .eq('id', sample_id);

    // Log audit trail
    await supabase
      .from('audit_trail')
      .insert({
        entity_type: 'quality_review',
        entity_id: review.id,
        action: 'created',
        user_id: reviewer_id,
        changes: `Quality review created: ${issue_type}`
      });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating quality review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/quality-reviews/:id
 * Update quality review
 */
router.put('/:id', async (req, res) => {
  try {
    const { issue_type, issue_description, severity, action_points, status, user_id } = req.body;

    // Get old review for audit trail
    const { data: oldReview } = await supabase
      .from('quality_reviews')
      .select('status')
      .eq('id', req.params.id)
      .single();

    const { data: review, error } = await supabase
      .from('quality_reviews')
      .update({
        issue_type,
        issue_description,
        severity,
        action_points,
        status
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    if (oldReview && oldReview.status !== status && user_id) {
      await supabase
        .from('audit_trail')
        .insert({
          entity_type: 'quality_review',
          entity_id: req.params.id,
          action: 'status_changed',
          user_id,
          changes: `Status changed from "${oldReview.status}" to "${status}"`
        });
    }

    res.json(review);
  } catch (error) {
    console.error('Error updating quality review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/quality-reviews/:id
 * Delete quality review
 */
router.delete('/:id', async (req, res) => {
  try {
    // Delete associated photos from filesystem
    const { data: photos } = await supabase
      .from('quality_review_photos')
      .select('file_path')
      .eq('quality_review_id', req.params.id);

    if (photos) {
      photos.forEach(photo => {
        const fullPath = path.join(__dirname, '../../../', photo.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    const { error } = await supabase
      .from('quality_reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Quality review deleted successfully' });
  } catch (error) {
    console.error('Error deleting quality review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews/:id/photos
 * Upload photos for quality review
 */
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const reviewId = req.params.id;
    const uploadedPhotos = [];

    for (const file of req.files) {
      const relativePath = `uploads/quality-reviews/${file.filename}`;
      
      const { data, error } = await supabase
        .from('quality_review_photos')
        .insert({
          quality_review_id: reviewId,
          file_path: relativePath,
          file_name: file.originalname
        })
        .select()
        .single();

      if (error) throw error;

      uploadedPhotos.push(data);
    }

    res.status(201).json(uploadedPhotos);
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/quality-reviews/:reviewId/photos/:photoId
 * Delete a photo
 */
router.delete('/:reviewId/photos/:photoId', async (req, res) => {
  try {
    const { data: photo } = await supabase
      .from('quality_review_photos')
      .select('file_path')
      .eq('id', req.params.photoId)
      .single();
    
    if (photo) {
      const fullPath = path.join(__dirname, '../../../', photo.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    const { error } = await supabase
      .from('quality_review_photos')
      .delete()
      .eq('id', req.params.photoId);

    if (error) throw error;

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quality-reviews/:id/comments
 * Add comment to quality review
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { user_id, comment } = req.body;

    const { data: newComment, error } = await supabase
      .from('quality_review_comments')
      .insert({
        quality_review_id: req.params.id,
        user_id,
        comment
      })
      .select(`
        *,
        user:users(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    // Transform data
    const transformedComment = {
      ...newComment,
      user_name: newComment.user 
        ? `${newComment.user.first_name} ${newComment.user.last_name}` 
        : null,
      user_email: newComment.user?.email
    };

    res.status(201).json(transformedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quality-reviews/stats/overview
 * Get overview statistics for quality reviews
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const { data: allReviews, error } = await supabase
      .from('quality_reviews')
      .select('status, severity');

    if (error) throw error;

    const stats = {
      total_reviews: allReviews.length,
      pending_review: allReviews.filter(r => r.status === 'Pending Review').length,
      changes_requested: allReviews.filter(r => r.status === 'Changes Requested').length,
      approved: allReviews.filter(r => r.status === 'Approved').length,
      high_severity: allReviews.filter(r => r.severity === 'High').length,
      medium_severity: allReviews.filter(r => r.severity === 'Medium').length,
      low_severity: allReviews.filter(r => r.severity === 'Low').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting quality review stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
