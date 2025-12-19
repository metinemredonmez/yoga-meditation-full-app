import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import * as sleepStoryController from '../controllers/sleepStoryController';

const router = Router();

// ==================== PUBLIC ENDPOINTS ====================

// GET /api/sleep/stories - Get sleep stories (optional auth for progress)
router.get('/', optionalAuth, sleepStoryController.getSleepStories);

// GET /api/sleep/stories/featured - Get featured stories
router.get('/featured', sleepStoryController.getFeaturedStories);

// GET /api/sleep/stories/categories - Get story categories
router.get('/categories', sleepStoryController.getCategories);

// GET /api/sleep/stories/category/:category - Get stories by category
router.get('/category/:category', sleepStoryController.getStoriesByCategory);

// ==================== AUTHENTICATED USER ENDPOINTS ====================

// GET /api/sleep/stories/history - Get listening history
router.get('/history', authenticateToken, sleepStoryController.getListeningHistory);

// GET /api/sleep/stories/continue - Get continue watching
router.get('/continue', authenticateToken, sleepStoryController.getContinueWatching);

// GET /api/sleep/stories/:id - Get story by ID (optional auth for progress)
router.get('/:id', optionalAuth, sleepStoryController.getSleepStory);

// POST /api/sleep/stories/:id/start - Start story playback
router.post('/:id/start', authenticateToken, sleepStoryController.startStory);

// POST /api/sleep/stories/:id/progress - Update progress
router.post('/:id/progress', authenticateToken, sleepStoryController.updateProgress);

// POST /api/sleep/stories/:id/complete - Complete story
router.post('/:id/complete', authenticateToken, sleepStoryController.completeStory);

// POST /api/sleep/stories/:id/rate - Rate story
router.post('/:id/rate', authenticateToken, sleepStoryController.rateStory);

// GET /api/sleep/stories/:id/ratings - Get story ratings
router.get('/:id/ratings', sleepStoryController.getStoryRatings);

export default router;
