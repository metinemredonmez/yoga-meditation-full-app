import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN NOTIFICATIONS ====================
// Frontend expects: /api/admin/notifications
// Provides: LIST, TEMPLATES, SEND

// GET /api/admin/notifications - List all notification logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const userId = req.query.userId as string;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [notifications, total] = await Promise.all([
      prisma.notification_logs.findMany({
        where,
        include: {
          users: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification_logs.count({ where }),
    ]);

    res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        user: n.users,
        title: n.title,
        body: n.body,
        data: n.data,
        status: n.status,
        errorMessage: n.errorMessage,
        sentAt: n.sentAt,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notifications');
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// GET /api/admin/notifications/stats - Get notification statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, byStatus, last24Hours, last7Days] = await Promise.all([
      prisma.notification_logs.count(),
      prisma.notification_logs.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.notification_logs.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.notification_logs.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      stats: {
        total,
        last24Hours,
        last7Days,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notification stats');
    res.status(500).json({ error: 'Failed to get notification stats' });
  }
});

// POST /api/admin/notifications/send - Send notification to a user
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required' });
    }

    const notification = await prisma.notification_logs.create({
      data: {
        userId,
        title,
        body,
        data,
        status: 'PENDING',
      },
    });

    // Here you would typically integrate with a push notification service
    // For now, we'll just mark it as sent
    await prisma.notification_logs.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    res.json({ success: true, notification });
  } catch (error) {
    logger.error({ err: error }, 'Failed to send notification');
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /api/admin/notifications/send-bulk - Send notifications to multiple users
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ error: 'userIds (array), title, and body are required' });
    }

    const notifications = await prisma.notification_logs.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        title,
        body,
        data,
        status: 'SENT',
        sentAt: new Date(),
      })),
    });

    res.json({ success: true, count: notifications.count });
  } catch (error) {
    logger.error({ err: error }, 'Failed to send bulk notifications');
    res.status(500).json({ error: 'Failed to send bulk notifications' });
  }
});

// ==================== NOTIFICATION TEMPLATES ====================

// GET /api/admin/notifications/templates - Get notification templates
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const config = await prisma.gamification_config.findUnique({
      where: { key: 'notification_templates_config' },
    });
    res.json({ templates: config?.value || [] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notification templates');
    res.status(500).json({ error: 'Failed to get notification templates' });
  }
});

// PUT /api/admin/notifications/templates - Update notification templates
router.put('/templates', async (req: Request, res: Response) => {
  try {
    const { templates } = req.body;
    await prisma.gamification_config.upsert({
      where: { key: 'notification_templates_config' },
      update: { value: templates },
      create: {
        key: 'notification_templates_config',
        value: templates,
        description: 'Notification templates configuration',
      },
    });
    res.json({ success: true, templates });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update notification templates');
    res.status(500).json({ error: 'Failed to update notification templates' });
  }
});

// ==================== PUSH PROVIDER SETTINGS ====================

// GET /api/admin/notifications/provider-settings - Get push provider settings
router.get('/provider-settings', async (_req: Request, res: Response) => {
  try {
    const config = await prisma.gamification_config.findUnique({
      where: { key: 'push_provider_settings' },
    });
    res.json(config?.value || { providers: [], emailConfig: null });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get provider settings');
    res.status(500).json({ error: 'Failed to get provider settings' });
  }
});

// PUT /api/admin/notifications/provider-settings - Update push provider settings
router.put('/provider-settings', async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    await prisma.gamification_config.upsert({
      where: { key: 'push_provider_settings' },
      update: { value: settings },
      create: {
        key: 'push_provider_settings',
        value: settings,
        description: 'Push notification provider settings',
      },
    });
    res.json({ success: true, settings });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update provider settings');
    res.status(500).json({ error: 'Failed to update provider settings' });
  }
});

// ==================== BROADCAST CAMPAIGNS ====================

// GET /api/admin/notifications/campaigns - Get broadcast campaigns
router.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const config = await prisma.gamification_config.findUnique({
      where: { key: 'broadcast_campaigns_config' },
    });
    res.json({ campaigns: config?.value || [] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get campaigns');
    res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

// POST /api/admin/notifications/campaigns - Create a campaign
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaign = req.body;
    const config = await prisma.gamification_config.findUnique({
      where: { key: 'broadcast_campaigns_config' },
    });
    const campaigns = (config?.value as any[]) || [];
    campaigns.unshift({ ...campaign, id: `campaign-${Date.now()}`, createdAt: new Date().toISOString() });

    await prisma.gamification_config.upsert({
      where: { key: 'broadcast_campaigns_config' },
      update: { value: campaigns },
      create: {
        key: 'broadcast_campaigns_config',
        value: campaigns,
        description: 'Broadcast notification campaigns',
      },
    });
    res.json({ success: true, campaign: campaigns[0] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create campaign');
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/admin/notifications/campaigns/:id - Update a campaign
router.put('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const config = await prisma.gamification_config.findUnique({
      where: { key: 'broadcast_campaigns_config' },
    });
    const campaigns = (config?.value as any[]) || [];
    const index = campaigns.findIndex((c: any) => c.id === id);

    if (index < 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaigns[index] = { ...campaigns[index], ...updates };
    await prisma.gamification_config.update({
      where: { key: 'broadcast_campaigns_config' },
      data: { value: campaigns },
    });
    res.json({ success: true, campaign: campaigns[index] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update campaign');
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

export default router;
