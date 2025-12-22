import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN CLASSES ====================
// Frontend expects: /api/admin/classes
// Provides full CRUD for yoga classes

// GET /api/admin/classes - List all classes with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const level = req.query.level as string;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (level) where.level = level;
    if (category) where.category = category;
    if (status) where.status = status;

    const [classes, total] = await Promise.all([
      prisma.classes.findMany({
        where,
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.classes.count({ where }),
    ]);

    res.json({
      classes: classes.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        thumbnailUrl: c.thumbnailUrl,
        videoUrl: c.videoUrl,
        instructor: c.users,
        status: c.status,
        isFree: c.isFree,
        isLive: c.isLive,
        completions: c.completions,
        enrollments: c.enrollments,
        rating: c.ratingCount > 0 ? c.totalRating / c.ratingCount : 0,
        schedule: c.schedule,
        createdAt: c.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get admin classes');
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// GET /api/admin/classes/stats - Get class statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, byStatus, byLevel] = await Promise.all([
      prisma.classes.count(),
      prisma.classes.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.classes.groupBy({
        by: ['level'],
        _count: { id: true },
      }),
    ]);

    res.json({
      stats: {
        total,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byLevel: byLevel.map((l) => ({
          level: l.level,
          count: l._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get class stats');
    res.status(500).json({ error: 'Failed to get class stats' });
  }
});

// GET /api/admin/classes/:id - Get a specific class
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classItem = await prisma.classes.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: classItem });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get class');
    res.status(500).json({ error: 'Failed to get class' });
  }
});

// POST /api/admin/classes - Create a new class
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      level,
      duration,
      thumbnailUrl,
      videoUrl,
      instructorId,
      schedule,
      status,
      isFree,
      isLive,
    } = req.body;

    const classItem = await prisma.classes.create({
      data: {
        title,
        description,
        category,
        level: level || 'BEGINNER',
        duration: duration || 30,
        thumbnailUrl,
        videoUrl,
        instructorId,
        schedule: schedule ? new Date(schedule) : new Date(),
        status: status || 'DRAFT',
        isFree: isFree ?? false,
        isLive: isLive ?? false,
      },
    });

    res.status(201).json(classItem);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create class');
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PUT /api/admin/classes/:id - Update a class
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert schedule to Date if provided
    if (updateData.schedule) {
      updateData.schedule = new Date(updateData.schedule);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const classItem = await prisma.classes.update({
      where: { id },
      data: updateData,
    });

    res.json(classItem);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update class');
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE /api/admin/classes/:id - Delete a class
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.classes.delete({ where: { id } });
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete class');
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
