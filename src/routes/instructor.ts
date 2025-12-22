import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireInstructor } from '../middleware/instructorAccess';
import { validateBody } from '../middleware/validateRequest';
import { requireNotificationAccess } from '../middleware/instructorTier';
import * as instructorController from '../controllers/instructorController';
import * as instructorNotificationController from '../controllers/instructorNotificationController';
import * as instructorSettingsController from '../controllers/instructorSettingsController';
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
// Dashboard
// ============================================

// Get instructor dashboard data
router.get(
  '/dashboard',
  requireInstructor,
  instructorController.getDashboard,
);

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

// ============================================
// Classes Management (Own Classes)
// ============================================

// Get my classes
router.get(
  '/classes',
  requireInstructor,
  instructorController.getMyClasses,
);

// Get single class
router.get(
  '/classes/:id',
  requireInstructor,
  instructorController.getMyClassById,
);

// Create class
router.post(
  '/classes',
  requireInstructor,
  instructorController.createMyClass,
);

// Update class
router.put(
  '/classes/:id',
  requireInstructor,
  instructorController.updateMyClass,
);

// Delete class
router.delete(
  '/classes/:id',
  requireInstructor,
  instructorController.deleteMyClass,
);

// Submit class for review
router.post(
  '/classes/:id/submit',
  requireInstructor,
  instructorController.submitClassForReview,
);

// ============================================
// Programs Management (Own Programs)
// ============================================

// Get my programs
router.get(
  '/programs',
  requireInstructor,
  instructorController.getMyPrograms,
);

// Get single program
router.get(
  '/programs/:id',
  requireInstructor,
  instructorController.getMyProgramById,
);

// Create program
router.post(
  '/programs',
  requireInstructor,
  instructorController.createMyProgram,
);

// Update program
router.put(
  '/programs/:id',
  requireInstructor,
  instructorController.updateMyProgram,
);

// Delete program
router.delete(
  '/programs/:id',
  requireInstructor,
  instructorController.deleteMyProgram,
);

// Submit program for review
router.post(
  '/programs/:id/submit',
  requireInstructor,
  instructorController.submitProgramForReview,
);

// ============================================
// Students
// ============================================

// Get my students
router.get(
  '/students',
  requireInstructor,
  instructorController.getMyStudents,
);

// ============================================
// Tier & Billing
// ============================================

// Get tier info and upgrade options
router.get(
  '/tier',
  requireInstructor,
  instructorNotificationController.getTierInfo,
);

// Initiate tier upgrade
router.post(
  '/tier/upgrade',
  requireInstructor,
  instructorNotificationController.upgradeTier,
);

// Confirm tier upgrade after payment
router.post(
  '/tier/confirm',
  requireInstructor,
  instructorNotificationController.confirmTierUpgrade,
);

// ============================================
// Settings
// ============================================

// Get instructor settings
router.get(
  '/settings',
  requireInstructor,
  instructorController.getSettings,
);

// Update instructor settings
router.put(
  '/settings',
  requireInstructor,
  instructorController.updateSettings,
);

// ============================================
// Notifications (Requires PRO+ tier)
// ============================================

// Get notification settings
router.get(
  '/notifications/settings',
  requireInstructor,
  instructorNotificationController.getNotificationSettings,
);

// Update notification settings
router.put(
  '/notifications/settings',
  requireInstructor,
  instructorNotificationController.updateNotificationSettings,
);

// Send notification to students (requires PRO+)
router.post(
  '/notifications/send',
  requireInstructor,
  requireNotificationAccess,
  instructorNotificationController.sendNotificationToStudents,
);

// ============================================
// Extended Settings
// ============================================

// Security
router.get('/settings/security', requireInstructor, instructorSettingsController.getSecuritySettings);
router.post('/settings/security/change-password', requireInstructor, instructorSettingsController.changePassword);
router.post('/settings/security/toggle-2fa', requireInstructor, instructorSettingsController.toggle2FA);
router.post('/settings/security/terminate-sessions', requireInstructor, instructorSettingsController.terminateAllSessions);

// Preferences (language, timezone)
router.get('/settings/preferences', requireInstructor, instructorSettingsController.getPreferences);
router.put('/settings/preferences', requireInstructor, instructorSettingsController.updatePreferences);

// Class preferences
router.get('/settings/class-preferences', requireInstructor, instructorSettingsController.getClassPreferences);
router.put('/settings/class-preferences', requireInstructor, instructorSettingsController.updateClassPreferences);

// Calendar integrations
router.get('/settings/calendar-integrations', requireInstructor, instructorSettingsController.getCalendarIntegrations);
router.post('/settings/calendar-integrations', requireInstructor, instructorSettingsController.updateCalendarIntegration);

// Account actions
router.post('/settings/account/deactivate', requireInstructor, instructorSettingsController.deactivateAccount);
router.post('/settings/account/delete', requireInstructor, instructorSettingsController.deleteAccount);

export default router;
