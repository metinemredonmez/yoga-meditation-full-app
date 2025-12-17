import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import * as gamificationController from '../controllers/gamificationController';
import {
  xpLeaderboardQuerySchema,
  celebrateMilestoneBodySchema,
} from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// XP & Level Routes
// ============================================

// Get user's gamification stats
router.get('/stats', authenticate, gamificationController.getUserStats);

// Get user's level info
router.get('/level', authenticate, gamificationController.getLevelInfo);

// Get XP history
router.get('/xp/history', authenticate, gamificationController.getXPHistory);

// Get XP leaderboard
router.get(
  '/xp/leaderboard',
  optionalAuth,
  validateQuery(xpLeaderboardQuerySchema),
  gamificationController.getXPLeaderboard,
);

// ============================================
// Streak Routes
// ============================================

// Get streak info
router.get('/streak', authenticate, gamificationController.getStreakInfo);

// Use streak freeze
router.post('/streak/freeze', authenticate, gamificationController.useStreakFreeze);

// Get streak leaderboard
router.get(
  '/streak/leaderboard',
  optionalAuth,
  validateQuery(xpLeaderboardQuerySchema),
  gamificationController.getStreakLeaderboard,
);

// ============================================
// Milestone Routes
// ============================================

// Get user milestones
router.get('/milestones', authenticate, gamificationController.getMilestones);

// Get upcoming milestones
router.get('/milestones/upcoming', authenticate, gamificationController.getUpcomingMilestones);

// Celebrate milestone (mark as celebrated)
router.post(
  '/milestones/celebrate',
  authenticate,
  validateBody(celebrateMilestoneBodySchema),
  gamificationController.celebrateMilestone,
);

export default router;
