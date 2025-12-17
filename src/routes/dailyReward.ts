import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as dailyRewardController from '../controllers/dailyRewardController';
import { dailyRewardHistoryQuerySchema } from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Daily Reward Routes (All require authentication)
// ============================================

// Get daily reward status
router.get('/status', authenticate, dailyRewardController.getDailyRewardStatus);

// Claim daily reward
router.post('/claim', authenticate, dailyRewardController.claimDailyReward);

// Get daily reward calendar (30 days)
router.get('/calendar', authenticate, dailyRewardController.getDailyRewardCalendar);

// Get claim history
router.get(
  '/history',
  authenticate,
  validateQuery(dailyRewardHistoryQuerySchema),
  dailyRewardController.getDailyRewardHistory,
);

export default router;
