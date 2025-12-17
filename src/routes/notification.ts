import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { sendTestNotification } from '../controllers/notificationController';

const router = Router();

/**
 * @openapi
 * /api/notifications/test:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Send a test notification via configured channels
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationTestRequest'
 *     responses:
 *       200:
 *         description: Notification dispatched.
 */
router.post('/test', authenticateToken, requireRoles('ADMIN'), sendTestNotification);

export default router;
