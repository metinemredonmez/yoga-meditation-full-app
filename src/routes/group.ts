import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import {
  createGroupBodySchema,
  updateGroupBodySchema,
  createGroupPostBodySchema,
  updateGroupPostBodySchema,
  updateMemberRoleBodySchema,
} from '../validation/communitySchemas';

const router = Router();

// ============================================
// Group Routes (Public)
// ============================================

// Get all groups
router.get('/', groupController.getGroups);

// Get group by ID
router.get('/:id', optionalAuth, groupController.getGroupById);

// Get group by slug
router.get('/slug/:slug', optionalAuth, groupController.getGroupBySlug);

// Get group members
router.get('/:id/members', groupController.getGroupMembers);

// Get group posts
router.get('/:id/posts', optionalAuth, groupController.getGroupPosts);

// ============================================
// Group Routes (Authenticated)
// ============================================

// Create group
router.post(
  '/',
  authenticate,
  validateBody(createGroupBodySchema),
  groupController.createGroup,
);

// Update group
router.put(
  '/:id',
  authenticate,
  validateBody(updateGroupBodySchema),
  groupController.updateGroup,
);

// Delete group
router.delete('/:id', authenticate, groupController.deleteGroup);

// My groups
router.get('/me/groups', authenticate, groupController.getMyGroups);

// ============================================
// Membership Routes
// ============================================

// Join group
router.post('/:id/join', authenticate, groupController.joinGroup);

// Leave group
router.delete('/:id/leave', authenticate, groupController.leaveGroup);

// Update member role
router.put(
  '/:id/members/:memberId/role',
  authenticate,
  validateBody(updateMemberRoleBodySchema),
  groupController.updateMemberRole,
);

// Remove member
router.delete('/:id/members/:memberId', authenticate, groupController.removeMember);

// ============================================
// Group Post Routes
// ============================================

// Get post by ID
router.get('/posts/:postId', groupController.getGroupPost);

// Create post
router.post(
  '/:id/posts',
  authenticate,
  validateBody(createGroupPostBodySchema),
  groupController.createGroupPost,
);

// Update post
router.put(
  '/:id/posts/:postId',
  authenticate,
  validateBody(updateGroupPostBodySchema),
  groupController.updateGroupPost,
);

// Delete post
router.delete('/:id/posts/:postId', authenticate, groupController.deleteGroupPost);

// Like/Unlike post
router.post('/posts/:postId/like', authenticate, groupController.likeGroupPost);
router.delete('/posts/:postId/like', authenticate, groupController.unlikeGroupPost);

// ============================================
// Group Post Comment Routes
// ============================================

// Get post comments
router.get('/posts/:postId/comments', groupController.getPostComments);

// Create comment
router.post('/posts/:postId/comments', authenticate, groupController.createPostComment);

// Update comment
router.put('/comments/:commentId', authenticate, groupController.updatePostComment);

// Delete comment
router.delete('/comments/:commentId', authenticate, groupController.deletePostComment);

export default router;
