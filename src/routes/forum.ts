import { Router } from 'express';
import * as forumController from '../controllers/forumController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import {
  createCategoryBodySchema,
  updateCategoryBodySchema,
  createTopicBodySchema,
  updateTopicBodySchema,
  createPostBodySchema,
  updatePostBodySchema,
  createTagBodySchema,
} from '../validation/communitySchemas';

const router = Router();

// ============================================
// Public Routes
// ============================================

// Get all categories
router.get('/categories', forumController.getCategories);

// Get category by slug
router.get('/categories/slug/:slug', forumController.getCategoryBySlug);

// Get topics (with filters)
router.get('/topics', optionalAuth, forumController.getTopics);

// Get topic by ID
router.get('/topics/:id', optionalAuth, forumController.getTopicById);

// Get topic by slug
router.get('/topics/slug/:slug', optionalAuth, forumController.getTopicBySlug);

// Get posts by topic
router.get('/topics/:topicId/posts', forumController.getPostsByTopic);

// Get all tags
router.get('/tags', forumController.getTags);

// Get forum stats
router.get('/stats', forumController.getForumStats);

// ============================================
// Authenticated Routes
// ============================================

// Create topic
router.post(
  '/topics',
  authenticate,
  validateBody(createTopicBodySchema),
  forumController.createTopic,
);

// Update topic
router.put(
  '/topics/:id',
  authenticate,
  validateBody(updateTopicBodySchema),
  forumController.updateTopic,
);

// Delete topic
router.delete('/topics/:id', authenticate, forumController.deleteTopic);

// Create post
router.post(
  '/topics/:topicId/posts',
  authenticate,
  validateBody(createPostBodySchema),
  forumController.createPost,
);

// Update post
router.put(
  '/posts/:id',
  authenticate,
  validateBody(updatePostBodySchema),
  forumController.updatePost,
);

// Delete post
router.delete('/posts/:id', authenticate, forumController.deletePost);

// Mark post as accepted answer
router.post('/topics/:topicId/posts/:id/accept', authenticate, forumController.markPostAsAccepted);

// Like/Unlike post
router.post('/posts/:id/like', authenticate, forumController.likePost);
router.delete('/posts/:id/like', authenticate, forumController.unlikePost);

// Follow/Unfollow topic
router.post('/topics/:id/follow', authenticate, forumController.followTopic);
router.delete('/topics/:id/follow', authenticate, forumController.unfollowTopic);

// ============================================
// Admin Routes
// ============================================

// Create category
router.post(
  '/admin/categories',
  authenticate,
  requireAdmin,
  validateBody(createCategoryBodySchema),
  forumController.createCategory,
);

// Update category
router.put(
  '/admin/categories/:id',
  authenticate,
  requireAdmin,
  validateBody(updateCategoryBodySchema),
  forumController.updateCategory,
);

// Delete category
router.delete('/admin/categories/:id', authenticate, requireAdmin, forumController.deleteCategory);

// Create tag
router.post(
  '/admin/tags',
  authenticate,
  requireAdmin,
  validateBody(createTagBodySchema),
  forumController.createTag,
);

// Delete tag
router.delete('/admin/tags/:id', authenticate, requireAdmin, forumController.deleteTag);

export default router;
