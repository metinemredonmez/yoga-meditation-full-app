import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as achievementController from '../controllers/achievementController';
import {
  achievementQuerySchema,
  userAchievementQuerySchema,
} from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Public Routes
// ============================================

// Get all achievements
router.get(
  '/',
  optionalAuth,
  validateQuery(achievementQuerySchema),
  achievementController.getAchievements,
);

// Get achievement categories
router.get('/categories', achievementController.getAchievementCategories);

// Get achievement by ID
router.get('/:id', optionalAuth, achievementController.getAchievementById);

// ============================================
// Authenticated User Routes
// ============================================

// Get user's achievements
router.get(
  '/user/list',
  authenticate,
  validateQuery(userAchievementQuerySchema),
  achievementController.getUserAchievements,
);

// Get user's achievement stats
router.get('/user/stats', authenticate, achievementController.getUserAchievementStats);

// Get secret achievements (with unlock hints)
router.get('/user/secrets', authenticate, achievementController.getSecretAchievements);

// Get progress for specific achievement
router.get('/user/:id/progress', authenticate, achievementController.getAchievementProgress);

// Claim achievement reward
router.post('/user/:id/claim', authenticate, achievementController.claimAchievementReward);

export default router;
