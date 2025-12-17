import { Router } from 'express';
import * as socialController from '../controllers/socialController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import {
  createBadgeBodySchema,
  updateBadgeBodySchema,
  createShareBodySchema,
} from '../validation/communitySchemas';

const router = Router();

// ============================================
// Public Routes
// ============================================

// Get user's followers
router.get('/users/:userId/followers', socialController.getFollowers);

// Get user's following
router.get('/users/:userId/following', socialController.getFollowing);

// Get user's follow stats
router.get('/users/:userId/stats', socialController.getFollowStats);

// Get user's public activities
router.get('/users/:userId/activities', socialController.getUserActivities);

// Get user's badges
router.get('/users/:userId/badges', socialController.getUserBadges);

// Get all badges
router.get('/badges', socialController.getBadges);

// Get badge by ID
router.get('/badges/:id', socialController.getBadgeById);

// ============================================
// Authenticated Routes
// ============================================

// Follow user
router.post('/users/:userId/follow', authenticate, socialController.followUser);

// Unfollow user
router.delete('/users/:userId/follow', authenticate, socialController.unfollowUser);

// Check follow status
router.get('/users/:userId/follow-status', authenticate, socialController.checkFollowStatus);

// Get my followers
router.get('/me/followers', authenticate, socialController.getMyFollowers);

// Get my following
router.get('/me/following', authenticate, socialController.getMyFollowing);

// Get my activities
router.get('/me/activities', authenticate, socialController.getMyActivities);

// Get my activity feed
router.get('/me/feed', authenticate, socialController.getActivityFeed);

// Get my badges
router.get('/me/badges', authenticate, socialController.getMyBadges);

// Get my badge stats
router.get('/me/badges/stats', authenticate, socialController.getMyBadgeStats);

// Get new badges count
router.get('/me/badges/new', authenticate, socialController.getNewBadgesCount);

// Mark badge as seen
router.post('/me/badges/:badgeId/seen', authenticate, socialController.markBadgeAsSeen);

// Block user
router.post('/users/:userId/block', authenticate, socialController.blockUser);

// Unblock user
router.delete('/users/:userId/block', authenticate, socialController.unblockUser);

// Get blocked users
router.get('/me/blocked', authenticate, socialController.getBlockedUsers);

// Create share
router.post(
  '/shares',
  authenticate,
  validateBody(createShareBodySchema),
  socialController.createShare,
);

// Get my shares
router.get('/me/shares', authenticate, socialController.getMyShares);

// Get my share stats
router.get('/me/shares/stats', authenticate, socialController.getMyShareStats);

// ============================================
// Admin Routes
// ============================================

// Create badge
router.post(
  '/admin/badges',
  authenticate,
  requireAdmin,
  validateBody(createBadgeBodySchema),
  socialController.createBadge,
);

// Update badge
router.put(
  '/admin/badges/:id',
  authenticate,
  requireAdmin,
  validateBody(updateBadgeBodySchema),
  socialController.updateBadge,
);

// Delete badge
router.delete('/admin/badges/:id', authenticate, requireAdmin, socialController.deleteBadge);

// Award badge to user
router.post('/admin/badges/award', authenticate, requireAdmin, socialController.awardBadgeToUser);

// Revoke badge from user
router.post('/admin/badges/revoke', authenticate, requireAdmin, socialController.revokeBadgeFromUser);

export default router;
