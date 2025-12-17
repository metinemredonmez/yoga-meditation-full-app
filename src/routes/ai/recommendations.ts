import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { z } from 'zod';
import {
  getFeed,
  getContinue,
  refreshRecommendations,
  trackView,
  trackClick,
  dismiss,
  getSimilar,
} from '../../controllers/ai/recommendationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const refreshBodySchema = z.object({
  context: z.enum([
    'HOME_FEED',
    'POST_CLASS',
    'SEARCH',
    'BROWSE',
    'NOTIFICATION',
    'EMAIL',
  ]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

const dismissBodySchema = z.object({
  feedback: z.enum([
    'LIKED',
    'DISLIKED',
    'NOT_INTERESTED',
    'ALREADY_DONE',
    'TOO_EASY',
    'TOO_HARD',
  ]).optional(),
});

// Routes

/**
 * @route GET /api/ai/recommendations/feed
 * @desc Get personalized feed
 * @access Private
 */
router.get('/feed', getFeed);

/**
 * @route GET /api/ai/recommendations/continue
 * @desc Get continue watching recommendations
 * @access Private
 */
router.get('/continue', getContinue);

/**
 * @route POST /api/ai/recommendations/refresh
 * @desc Force refresh recommendations
 * @access Private
 */
router.post('/refresh', validateRequest({ body: refreshBodySchema }), refreshRecommendations);

/**
 * @route POST /api/ai/recommendations/:recommendationId/view
 * @desc Track recommendation view
 * @access Private
 */
router.post('/:recommendationId/view', trackView);

/**
 * @route POST /api/ai/recommendations/:recommendationId/click
 * @desc Track recommendation click
 * @access Private
 */
router.post('/:recommendationId/click', trackClick);

/**
 * @route POST /api/ai/recommendations/:recommendationId/dismiss
 * @desc Dismiss recommendation
 * @access Private
 */
router.post(
  '/:recommendationId/dismiss',
  validateRequest({ body: dismissBodySchema }),
  dismiss
);

/**
 * @route GET /api/ai/recommendations/similar/:entityType/:entityId
 * @desc Get similar content
 * @access Private
 */
router.get('/similar/:entityType/:entityId', getSimilar);

export default router;
