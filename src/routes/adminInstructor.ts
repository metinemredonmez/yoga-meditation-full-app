import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import * as adminInstructorController from '../controllers/adminInstructorController';
import {
  approveInstructorSchema,
  rejectInstructorSchema,
  updateTierSchema,
  moderateReviewSchema,
  completePayoutSchema,
  failPayoutSchema,
  recordEarningSchema,
} from '../validation/instructorSchemas';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ============================================
// Instructor Management
// ============================================

// Get all instructors
router.get(
  '/',
  adminInstructorController.getAllInstructors,
);

// Get instructor by ID
router.get(
  '/:id',
  adminInstructorController.getInstructor,
);

// Approve instructor
router.post(
  '/:id/approve',
  validateBody(approveInstructorSchema),
  adminInstructorController.approveInstructor,
);

// Reject instructor
router.post(
  '/:id/reject',
  validateBody(rejectInstructorSchema),
  adminInstructorController.rejectInstructor,
);

// Suspend instructor
router.post(
  '/:id/suspend',
  validateBody(rejectInstructorSchema),
  adminInstructorController.suspendInstructor,
);

// Reactivate instructor
router.post(
  '/:id/reactivate',
  adminInstructorController.reactivateInstructor,
);

// Update instructor tier
router.put(
  '/:id/tier',
  validateBody(updateTierSchema),
  adminInstructorController.updateInstructorTier,
);

// Update instructor profile (admin override)
router.put(
  '/:id/profile',
  adminInstructorController.updateInstructorProfile,
);

// ============================================
// Instructor Details
// ============================================

// Get instructor earnings
router.get(
  '/:id/earnings',
  adminInstructorController.getInstructorEarnings,
);

// Record manual earning
router.post(
  '/:id/earnings',
  validateBody(recordEarningSchema),
  adminInstructorController.recordEarning,
);

// Get instructor analytics
router.get(
  '/:id/analytics',
  adminInstructorController.getInstructorAnalytics,
);

// Get instructor payout settings
router.get(
  '/:id/payout-settings',
  adminInstructorController.getInstructorPayoutSettings,
);

// Get instructor payouts
router.get(
  '/:id/payouts',
  adminInstructorController.getInstructorPayouts,
);

// ============================================
// Payout Management
// ============================================

// Get pending payouts
router.get(
  '/payouts/pending',
  adminInstructorController.getPendingPayouts,
);

// Get processing payouts
router.get(
  '/payouts/processing',
  adminInstructorController.getProcessingPayouts,
);

// Process a payout
router.post(
  '/payouts/:payoutId/process',
  adminInstructorController.processPayout,
);

// Complete a payout
router.post(
  '/payouts/:payoutId/complete',
  validateBody(completePayoutSchema),
  adminInstructorController.completePayout,
);

// Fail a payout
router.post(
  '/payouts/:payoutId/fail',
  validateBody(failPayoutSchema),
  adminInstructorController.failPayout,
);

// Cancel a payout
router.post(
  '/payouts/:payoutId/cancel',
  validateBody(rejectInstructorSchema),
  adminInstructorController.cancelPayout,
);

// Run automatic payouts
router.post(
  '/payouts/auto-process',
  adminInstructorController.runAutomaticPayouts,
);

// ============================================
// Review Moderation
// ============================================

// Get pending reviews
router.get(
  '/reviews/pending',
  adminInstructorController.getPendingReviews,
);

// Get review by ID
router.get(
  '/reviews/:reviewId',
  adminInstructorController.getReview,
);

// Moderate a review
router.post(
  '/reviews/:reviewId/moderate',
  validateBody(moderateReviewSchema),
  adminInstructorController.moderateReview,
);

// ============================================
// Platform Analytics
// ============================================

// Get platform earnings
router.get(
  '/platform/earnings',
  adminInstructorController.getPlatformEarnings,
);

// Generate daily snapshots
router.post(
  '/analytics/generate-snapshots',
  adminInstructorController.generateDailySnapshots,
);

// Update all instructor stats
router.post(
  '/stats/update-all',
  adminInstructorController.updateAllStats,
);

export default router;
