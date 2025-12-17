import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as eventController from '../controllers/eventController';
import { eventQuerySchema, leaderboardQuerySchema } from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Public Routes
// ============================================

// Get active events
router.get('/active', eventController.getActiveEvents);

// Get all events with filters
router.get('/', validateQuery(eventQuerySchema), eventController.getAllEvents);

// Get event by ID
router.get('/:id', eventController.getEventById);

// Get event leaderboard
router.get(
  '/:id/leaderboard',
  optionalAuth,
  validateQuery(leaderboardQuerySchema),
  eventController.getEventLeaderboard,
);

// ============================================
// Authenticated User Routes
// ============================================

// Get user's event history
router.get('/user/history', authenticate, eventController.getEventHistory);

// Join event
router.post('/:id/join', authenticate, eventController.joinEvent);

// Leave event
router.post('/:id/leave', authenticate, eventController.leaveEvent);

// Get user's progress in event
router.get('/:id/progress', authenticate, eventController.getEventProgress);

// Claim event rewards
router.post('/:id/claim', authenticate, eventController.claimEventRewards);

export default router;
