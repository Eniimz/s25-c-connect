import express from 'express';
import resumeRoutes from './resumeRoutes.js';

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/api', resumeRoutes);

export default router;

