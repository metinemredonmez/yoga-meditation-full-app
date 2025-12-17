import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import {
  createCommentBodySchema,
  updateCommentBodySchema,
} from '../validation/communitySchemas';

const router = Router();

// ============================================
// Public Routes
// ============================================

// Get comments (with filters)
router.get('/', optionalAuth, commentController.getComments);

// Get comment by ID
router.get('/:id', commentController.getCommentById);

// Get comment replies
router.get('/:id/replies', commentController.getCommentReplies);

// Get review stats for a program
router.get('/programs/:programId/stats', commentController.getProgramReviewStats);

// Get review stats for a class
router.get('/classes/:classId/stats', commentController.getClassReviewStats);

// ============================================
// Authenticated Routes
// ============================================

// Create comment/review
router.post(
  '/',
  authenticate,
  validateBody(createCommentBodySchema),
  commentController.createComment,
);

// Update comment
router.put(
  '/:id',
  authenticate,
  validateBody(updateCommentBodySchema),
  commentController.updateComment,
);

// Delete comment
router.delete('/:id', authenticate, commentController.deleteComment);

// Like/Unlike comment
router.post('/:id/like', authenticate, commentController.likeComment);
router.delete('/:id/like', authenticate, commentController.unlikeComment);

// Get my reviews
router.get('/me/reviews', authenticate, commentController.getMyReviews);

// ============================================
// Admin Routes
// ============================================

// Hide comment
router.post('/admin/:id/hide', authenticate, requireAdmin, commentController.hideComment);

// Unhide comment
router.post('/admin/:id/unhide', authenticate, requireAdmin, commentController.unhideComment);

// Get reported comments
router.get('/admin/reported', authenticate, requireAdmin, commentController.getReportedComments);

export default router;
