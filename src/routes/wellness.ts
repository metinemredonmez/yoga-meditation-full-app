import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as wellnessController from '../controllers/wellnessController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/wellness/stats - Get user's overall wellness stats
router.get('/stats', wellnessController.getWellnessStats);

// GET /api/wellness/summary - Get wellness summary (dashboard view)
router.get('/summary', wellnessController.getWellnessSummary);

// GET /api/wellness/streak - Get streak info
router.get('/streak', wellnessController.getStreakInfo);

// POST /api/wellness/activity - Record activity (internal use)
router.post('/activity', wellnessController.recordActivity);

export default router;
