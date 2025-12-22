import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN USER GOALS ====================
// Frontend expects: /api/admin/user-goals
// Provides: LIST, STATS, DELETE

// GET /api/admin/user-goals - List all user goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const type = req.query.type as string;
    const isActive = req.query.isActive as string;
    const isCompleted = req.query.isCompleted as string;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';

    const [goals, total] = await Promise.all([
      prisma.user_goals.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user_goals.count({ where }),
    ]);

    res.json({
      goals: goals.map((g) => ({
        id: g.id,
        userId: g.userId,
        user: g.user,
        type: g.type,
        title: g.title,
        description: g.description,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        unit: g.unit,
        period: g.period,
        isActive: g.isActive,
        isCompleted: g.isCompleted,
        startDate: g.startDate,
        endDate: g.endDate,
        createdAt: g.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get admin user goals');
    res.status(500).json({ error: 'Failed to get user goals' });
  }
});

// GET /api/admin/user-goals/stats - Get user goal statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, completed, byType, uniqueUsers, last30Days] = await Promise.all([
      prisma.user_goals.count(),
      prisma.user_goals.count({ where: { isActive: true } }),
      prisma.user_goals.count({ where: { isCompleted: true } }),
      prisma.user_goals.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.user_goals.groupBy({
        by: ['userId'],
        _count: { id: true },
      }),
      prisma.user_goals.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      stats: {
        total,
        active,
        completed,
        last30Days,
        uniqueUsers: uniqueUsers.length,
        byType: byType.map((t) => ({
          type: t.type,
          count: t._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user goal stats');
    res.status(500).json({ error: 'Failed to get user goal stats' });
  }
});

// GET /api/admin/user-goals/:id - Get a specific user goal
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const goal = await prisma.user_goals.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        progress: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user goal');
    res.status(500).json({ error: 'Failed to get user goal' });
  }
});

// DELETE /api/admin/user-goals/:id - Delete a user goal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete associated progress first
    await prisma.goal_progress.deleteMany({ where: { goalId: id } });
    await prisma.user_goals.delete({ where: { id } });

    res.json({ success: true, message: 'User goal deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete user goal');
    res.status(500).json({ error: 'Failed to delete user goal' });
  }
});

export default router;
