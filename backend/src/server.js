import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRouter from './routes/auth.js';
import collectionsRouter from './routes/collections.js';
import samplesRouter from './routes/samples.js';
import qualityReviewsRouter from './routes/qualityReviews.js';
import supplierCommRouter from './routes/supplierCommunications.js';
import usersRouter from './routes/users.js';
import photosRouter from './routes/photos.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/samples', samplesRouter);
app.use('/api/quality-reviews', qualityReviewsRouter);
app.use('/api/supplier-communications', supplierCommRouter);
app.use('/api/users', usersRouter);
app.use('/api/photos', photosRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Viktor & Rolf QC System API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Viktor & Rolf QC System API running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
