import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN MOOD ENTRIES ====================
// Frontend expects: /api/admin/mood-entries
// Provides: LIST, STATS, DELETE

// GET /api/admin/mood-entries - List all mood entries
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const mood = req.query.mood as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (userId) where.userId = userId;
    if (mood) where.mood = mood;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.mood_entries.findMany({
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
      prisma.mood_entries.count({ where }),
    ]);

    res.json({
      entries: entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        user: e.user,
        mood: e.mood,
        moodScore: e.moodScore,
        energy: e.energy,
        stress: e.stress,
        notes: e.notes,
        tags: e.tags,
        date: e.date,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get admin mood entries');
    res.status(500).json({ error: 'Failed to get mood entries' });
  }
});

// GET /api/admin/mood-entries/stats - Get mood entry statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, byMood, last30Days, uniqueUsers] = await Promise.all([
      prisma.mood_entries.count(),
      prisma.mood_entries.groupBy({
        by: ['mood'],
        _count: { id: true },
      }),
      prisma.mood_entries.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.mood_entries.groupBy({
        by: ['userId'],
        _count: { id: true },
      }),
    ]);

    res.json({
      stats: {
        total,
        last30Days,
        uniqueUsers: uniqueUsers.length,
        byMood: byMood.map((m) => ({
          mood: m.mood,
          count: m._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mood entry stats');
    res.status(500).json({ error: 'Failed to get mood entry stats' });
  }
});

// DELETE /api/admin/mood-entries/:id - Delete a mood entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.mood_entries.delete({ where: { id } });
    res.json({ success: true, message: 'Mood entry deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete mood entry');
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

export default router;
