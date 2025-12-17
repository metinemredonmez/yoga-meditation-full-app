import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getTodayInsight,
  getInsightByDate,
  markViewed,
  getHistory,
  generateAudio,
  regenerateInsight,
} from '../../controllers/ai/insightController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes

/**
 * @route GET /api/ai/insights/today
 * @desc Get today's daily insight
 * @access Private
 */
router.get('/today', getTodayInsight);

/**
 * @route GET /api/ai/insights/history
 * @desc Get insight history
 * @access Private
 */
router.get('/history', getHistory);

/**
 * @route GET /api/ai/insights/:date
 * @desc Get insight by date (YYYY-MM-DD)
 * @access Private
 */
router.get('/:date', getInsightByDate);

/**
 * @route POST /api/ai/insights/:insightId/viewed
 * @desc Mark insight as viewed
 * @access Private
 */
router.post('/:insightId/viewed', markViewed);

/**
 * @route POST /api/ai/insights/:insightId/audio
 * @desc Generate audio for insight
 * @access Private
 */
router.post('/:insightId/audio', generateAudio);

/**
 * @route POST /api/ai/insights/regenerate
 * @desc Regenerate today's insight
 * @access Private
 */
router.post('/regenerate', regenerateInsight);

export default router;
