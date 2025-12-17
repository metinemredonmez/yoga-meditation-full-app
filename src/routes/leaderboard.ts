import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboardController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================
// Public Leaderboard Routes
// ============================================

// Get leaderboard
router.get('/', leaderboardController.getLeaderboard);

// Get leaderboard stats
router.get('/stats', leaderboardController.getLeaderboardStats);

// Get top by categories
router.get('/top/minutes', leaderboardController.getTopByMinutes);
router.get('/top/streaks', leaderboardController.getTopByStreaks);
router.get('/top/sessions', leaderboardController.getTopBySessions);

// Get user rank (public)
router.get('/users/:userId/rank', leaderboardController.getUserRank);

// ============================================
// Authenticated Routes
// ============================================

// Get my rank
router.get('/me/rank', authenticate, leaderboardController.getMyRank);

// Get my history
router.get('/me/history', authenticate, leaderboardController.getMyHistory);

// ============================================
// Admin Routes
// ============================================

// Recalculate ranks
router.post('/admin/recalculate', authenticate, requireAdmin, leaderboardController.recalculateRanks);

export default router;
