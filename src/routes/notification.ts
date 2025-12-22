import { Router, Request, Response } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { sendTestNotification } from '../controllers/notificationController';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

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

/**
 * Get user's notifications
 */
router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;

    const whereClause: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.user_notifications.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.user_notifications.count({ where: whereClause }),
      prisma.user_notifications.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notifications');
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * Mark a notification as read
 */
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await prisma.user_notifications.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.user_notifications.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, notification: updated });
  } catch (error) {
    logger.error({ err: error }, 'Failed to mark notification as read');
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * Mark all notifications as read
 */
router.post('/mark-all-read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.user_notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, updatedCount: result.count });
  } catch (error) {
    logger.error({ err: error }, 'Failed to mark all notifications as read');
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = await prisma.user_notifications.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.user_notifications.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete notification');
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
