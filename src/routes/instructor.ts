import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireInstructor } from '../middleware/instructorAccess';
import { validateBody } from '../middleware/validateRequest';
import * as instructorController from '../controllers/instructorController';
import {
  createProfileSchema,
  updateProfileSchema,
  requestPayoutSchema,
  updatePayoutSettingsSchema,
  replyToReviewSchema,
} from '../validation/instructorSchemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Profile Management
// ============================================

// Create instructor profile
router.post(
  '/profile',
  validateBody(createProfileSchema),
  instructorController.createProfile,
);

// Get my profile
router.get(
  '/profile',
  requireInstructor,
  instructorController.getMyProfile,
);

// Update my profile
router.put(
  '/profile',
  requireInstructor,
  validateBody(updateProfileSchema),
  instructorController.updateMyProfile,
);

// Submit for verification
router.post(
  '/profile/verify',
  requireInstructor,
  instructorController.submitForVerification,
);

// ============================================
// Dashboard
// ============================================

// Get dashboard overview
router.get(
  '/dashboard',
  requireInstructor,
  instructorController.getDashboardOverview,
);

// Get quick stats
router.get(
  '/dashboard/quick-stats',
  requireInstructor,
  instructorController.getQuickStats,
);

// Get recent activity
router.get(
  '/dashboard/activity',
  requireInstructor,
  instructorController.getRecentActivity,
);

// Get performance metrics
router.get(
  '/dashboard/performance',
  requireInstructor,
  instructorController.getPerformanceMetrics,
);

// ============================================
// Content
// ============================================

// Get my content
router.get(
  '/content',
  requireInstructor,
  instructorController.getMyContent,
);

// Get content performance
router.get(
  '/content/performance',
  requireInstructor,
  instructorController.getContentPerformance,
);

// ============================================
// Earnings
// ============================================

// Get earnings summary
router.get(
  '/earnings',
  requireInstructor,
  instructorController.getMyEarnings,
);

// Get earnings history
router.get(
  '/earnings/history',
  requireInstructor,
  instructorController.getEarningsHistory,
);

// Get earnings breakdown
router.get(
  '/earnings/breakdown',
  requireInstructor,
  instructorController.getEarningsBreakdown,
);

// ============================================
// Analytics
// ============================================

// Get analytics summary
router.get(
  '/analytics',
  requireInstructor,
  instructorController.getMyAnalytics,
);

// Get audience insights
router.get(
  '/analytics/audience',
  requireInstructor,
  instructorController.getAudienceInsights,
);

// ============================================
// Payouts
// ============================================

// Get payout settings
router.get(
  '/payouts/settings',
  requireInstructor,
  instructorController.getPayoutSettings,
);

// Update payout settings
router.put(
  '/payouts/settings',
  requireInstructor,
  validateBody(updatePayoutSettingsSchema),
  instructorController.updatePayoutSettings,
);

// Setup Stripe Connect
router.post(
  '/payouts/stripe-connect',
  requireInstructor,
  instructorController.setupStripeConnect,
);

// Request a payout
router.post(
  '/payouts/request',
  requireInstructor,
  validateBody(requestPayoutSchema),
  instructorController.requestPayout,
);

// Get my payouts
router.get(
  '/payouts',
  requireInstructor,
  instructorController.getMyPayouts,
);

// Get payout stats
router.get(
  '/payouts/stats',
  requireInstructor,
  instructorController.getPayoutStats,
);

// ============================================
// Reviews
// ============================================

// Get my reviews
router.get(
  '/reviews',
  requireInstructor,
  instructorController.getMyReviews,
);

// Reply to a review
router.post(
  '/reviews/:reviewId/reply',
  requireInstructor,
  validateBody(replyToReviewSchema),
  instructorController.replyToReview,
);

// Get review stats
router.get(
  '/reviews/stats',
  requireInstructor,
  instructorController.getReviewStats,
);

// ============================================
// Followers
// ============================================

// Get my followers
router.get(
  '/followers',
  requireInstructor,
  instructorController.getMyFollowers,
);

// Get follower stats
router.get(
  '/followers/stats',
  requireInstructor,
  instructorController.getFollowerStats,
);

export default router;
