import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import * as referralController from '../controllers/referralController';
import {
  applyReferralCodeBodySchema,
  leaderboardQuerySchema,
} from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Referral Code Routes
// ============================================

// Get user's referral code
router.get('/code', authenticate, referralController.getReferralCode);

// Validate a referral code (public, for signup form)
router.get('/validate/:code', referralController.validateCode);

// Apply referral code to user
router.post(
  '/apply',
  authenticate,
  validateBody(applyReferralCodeBodySchema),
  referralController.applyReferralCode,
);

// ============================================
// Stats & Leaderboard
// ============================================

// Get user's referral stats
router.get('/stats', authenticate, referralController.getReferralStats);

// Get referral leaderboard
router.get(
  '/leaderboard',
  validateQuery(leaderboardQuerySchema),
  referralController.getReferralLeaderboard,
);

export default router;
