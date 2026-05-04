import express from 'express';
import multer from 'multer';
import path from 'path';
import { supabase } from '../database/supabase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Use memory storage for Supabase uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload photos for a sample to Supabase Storage
router.post('/samples/:sampleId', verifyToken, upload.array('photos', 10), async (req, res) => {
  try {
    const { sampleId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify sample exists in Supabase
    const { data: sample, error: sampleError } = await supabase
      .from('samples')
      .select('id')
      .eq('id', sampleId)
      .single();

    if (sampleError || !sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Get current highest display order
    const { data: maxOrderData } = await supabase
      .from('sample_photos')
      .select('display_order')
      .eq('sample_id', sampleId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    let nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;
    const uploadedPhotos = [];

    for (const file of req.files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `sample-${sampleId}-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
      const filePath = `samples/${sampleId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sample-photos')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        continue; // Skip this file and try next
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sample-photos')
        .getPublicUrl(filePath);

      // Insert record into database
      const { data: photoRecord, error: insertError } = await supabase
        .from('sample_photos')
        .insert({
          sample_id: sampleId,
          file_path: publicUrl,
          file_name: file.originalname,
          display_order: nextOrder++,
          is_main_photo: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
      } else {
        uploadedPhotos.push(photoRecord);
      }
    }

    res.status(201).json(uploadedPhotos);
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photos' });
  }
});

// Get all photos for a sample
router.get('/samples/:sampleId', async (req, res) => {
  try {
    const { sampleId } = req.params;
    
    const { data: photos, error } = await supabase
      .from('sample_photos')
      .select('*')
      .eq('sample_id', sampleId)
      .order('is_main_photo', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get photos error:', error);
      return res.status(500).json({ error: 'Failed to retrieve photos' });
    }

    res.json(photos || []);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
});

// Set main photo for a sample
router.put('/:photoId/set-main', verifyToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Get the photo to find its sample_id
    const { data: photo, error: fetchError } = await supabase
      .from('sample_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Reset all photos for this sample to not be main
    await supabase
      .from('sample_photos')
      .update({ is_main_photo: false })
      .eq('sample_id', photo.sample_id);

    // Set this photo as main
    await supabase
      .from('sample_photos')
      .update({ is_main_photo: true })
      .eq('id', photoId);

    res.json({ message: 'Main photo updated successfully' });
  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ error: 'Failed to set main photo' });
  }
});

// Update photo display order
router.put('/:photoId/order', verifyToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { display_order } = req.body;

    const { error } = await supabase
      .from('sample_photos')
      .update({ display_order })
      .eq('id', photoId);

    if (error) {
      return res.status(500).json({ error: 'Failed to update photo order' });
    }

    res.json({ message: 'Photo order updated successfully' });
  } catch (error) {
    console.error('Update photo order error:', error);
    res.status(500).json({ error: 'Failed to update photo order' });
  }
});

// Delete a photo from both database and Supabase Storage
router.delete('/:photoId', verifyToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Get photo info before deleting
    const { data: photo, error: fetchError } = await supabase
      .from('sample_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Attempt to delete from Supabase Storage if it's a Supabase URL
    if (photo.file_path.includes('supabase.co')) {
      try {
        // Extract the path from the URL
        const urlParts = photo.file_path.split('/sample-photos/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          await supabase.storage.from('sample-photos').remove([storagePath]);
        }
      } catch (storageErr) {
        console.error('Error deleting from storage:', storageErr);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('sample_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete photo' });
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
