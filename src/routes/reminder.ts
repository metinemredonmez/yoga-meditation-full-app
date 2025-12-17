import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { scheduleReminder } from '../controllers/notificationController';
import { requireActiveSubscription } from '../middleware/entitlement';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(authenticatedRateLimiter);
router.use(requireActiveSubscription);

/**
 * @openapi
 * /api/reminders:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Schedule a reminder for a class or program session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReminderRequest'
 *     responses:
 *       201:
 *         description: Reminder scheduled.
 */
router.post('/', scheduleReminder);

export default router;
