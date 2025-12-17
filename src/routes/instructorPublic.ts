import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import * as instructorPublicController from '../controllers/instructorPublicController';
import {
  createReviewSchema,
  updateReviewSchema,
  reportReviewSchema,
  toggleNotificationsSchema,
} from '../validation/instructorSchemas';

const router = Router();

// ============================================
// Public Routes (No Auth Required)
// ============================================

// List all instructors
router.get(
  '/',
  instructorPublicController.listInstructors,
);

// Search instructors
router.get(
  '/search',
  instructorPublicController.searchInstructors,
);

// Get featured instructors
router.get(
  '/featured',
  instructorPublicController.getFeaturedInstructors,
);

// Get instructor by slug
router.get(
  '/:slug',
  optionalAuth,
  instructorPublicController.getInstructor,
);

// Get instructor by ID
router.get(
  '/id/:id',
  instructorPublicController.getInstructorById,
);

// Get instructor's programs
router.get(
  '/:slug/programs',
  instructorPublicController.getInstructorPrograms,
);

// Get instructor's classes
router.get(
  '/:slug/classes',
  instructorPublicController.getInstructorClasses,
);

// Get instructor's reviews
router.get(
  '/:slug/reviews',
  instructorPublicController.getInstructorReviews,
);

// Get rating distribution
router.get(
  '/:slug/ratings',
  instructorPublicController.getRatingDistribution,
);

// ============================================
// Authenticated User Routes
// ============================================

// Follow an instructor
router.post(
  '/:slug/follow',
  authenticate,
  instructorPublicController.followInstructor,
);

// Unfollow an instructor
router.delete(
  '/:slug/follow',
  authenticate,
  instructorPublicController.unfollowInstructor,
);

// Toggle follow notifications
router.put(
  '/:slug/follow/notifications',
  authenticate,
  validateBody(toggleNotificationsSchema),
  instructorPublicController.toggleFollowNotifications,
);

// Get follow status
router.get(
  '/:slug/follow/status',
  authenticate,
  instructorPublicController.getFollowStatus,
);

// Create a review
router.post(
  '/:slug/reviews',
  authenticate,
  validateBody(createReviewSchema),
  instructorPublicController.createReview,
);

// Update a review
router.put(
  '/reviews/:reviewId',
  authenticate,
  validateBody(updateReviewSchema),
  instructorPublicController.updateReview,
);

// Delete a review
router.delete(
  '/reviews/:reviewId',
  authenticate,
  instructorPublicController.deleteReview,
);

// Mark review as helpful
router.post(
  '/reviews/:reviewId/helpful',
  authenticate,
  instructorPublicController.markReviewHelpful,
);

// Report a review
router.post(
  '/reviews/:reviewId/report',
  authenticate,
  validateBody(reportReviewSchema),
  instructorPublicController.reportReview,
);

export default router;
