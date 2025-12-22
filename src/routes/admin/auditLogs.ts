import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN AUDIT LOGS ====================
// Frontend expects: /api/admin/audit-logs
// Provides: LIST, DETAIL, STATS

// GET /api/admin/audit-logs - List all audit logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
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
      prisma.audit_logs.count({ where }),
    ]);

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        user: log.users,
        action: log.action,
        actorRole: log.actorRole,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get audit logs');
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// GET /api/admin/audit-logs/stats - Get audit log statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, byAction, last24Hours, last7Days] = await Promise.all([
      prisma.audit_logs.count(),
      prisma.audit_logs.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.audit_logs.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.audit_logs.count({
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
        topActions: byAction.map((a) => ({
          action: a.action,
          count: a._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get audit log stats');
    res.status(500).json({ error: 'Failed to get audit log stats' });
  }
});

// GET /api/admin/audit-logs/:id - Get a specific audit log
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await prisma.audit_logs.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get audit log');
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

export default router;
