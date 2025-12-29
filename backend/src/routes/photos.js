import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import db from '../database/connection.js';
import { verifyToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/samples'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sample-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

// Upload photos for a sample
router.post('/samples/:sampleId', verifyToken, upload.array('photos', 10), (req, res) => {
  try {
    const { sampleId } = req.params;

    // Verify sample exists
    const sample = db.prepare('SELECT * FROM samples WHERE id = ?').get(sampleId);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Get current highest display order
    const maxOrder = db.prepare(
      'SELECT MAX(display_order) as max_order FROM sample_photos WHERE sample_id = ?'
    ).get(sampleId);
    
    let nextOrder = (maxOrder?.max_order || 0) + 1;

    // Insert photo records
    const insertStmt = db.prepare(`
      INSERT INTO sample_photos (sample_id, file_path, file_name, display_order)
      VALUES (?, ?, ?, ?)
    `);

    const photos = req.files.map(file => {
      const result = insertStmt.run(
        sampleId,
        `/uploads/samples/${file.filename}`,
        file.originalname,
        nextOrder++
      );
      
      return {
        id: result.lastInsertRowid,
        sample_id: parseInt(sampleId),
        file_path: `/uploads/samples/${file.filename}`,
        file_name: file.originalname,
        is_main_photo: 0,
        display_order: nextOrder - 1,
        uploaded_at: new Date().toISOString()
      };
    });

    res.status(201).json(photos);
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photos' });
  }
});

// Get all photos for a sample
router.get('/samples/:sampleId', (req, res) => {
  try {
    const { sampleId } = req.params;
    
    const photos = db.prepare(`
      SELECT * FROM sample_photos 
      WHERE sample_id = ? 
      ORDER BY is_main_photo DESC, display_order ASC
    `).all(sampleId);

    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to retrieve photos' });
  }
});

// Set main photo for a sample
router.put('/:photoId/set-main', verifyToken, (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Get the photo to find its sample_id
    const photo = db.prepare('SELECT * FROM sample_photos WHERE id = ?').get(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Reset all photos for this sample to not be main
    db.prepare('UPDATE sample_photos SET is_main_photo = 0 WHERE sample_id = ?')
      .run(photo.sample_id);

    // Set this photo as main
    db.prepare('UPDATE sample_photos SET is_main_photo = 1 WHERE id = ?')
      .run(photoId);

    res.json({ message: 'Main photo updated successfully' });
  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ error: 'Failed to set main photo' });
  }
});

// Update photo display order
router.put('/:photoId/order', verifyToken, (req, res) => {
  try {
    const { photoId } = req.params;
    const { display_order } = req.body;

    db.prepare('UPDATE sample_photos SET display_order = ? WHERE id = ?')
      .run(display_order, photoId);

    res.json({ message: 'Photo order updated successfully' });
  } catch (error) {
    console.error('Update photo order error:', error);
    res.status(500).json({ error: 'Failed to update photo order' });
  }
});

// Delete a photo
router.delete('/:photoId', verifyToken, (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Get photo info before deleting
    const photo = db.prepare('SELECT * FROM sample_photos WHERE id = ?').get(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from database
    db.prepare('DELETE FROM sample_photos WHERE id = ?').run(photoId);

    // TODO: Also delete the actual file from filesystem if needed
    // fs.unlinkSync(path.join(__dirname, '../../', photo.file_path));

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
