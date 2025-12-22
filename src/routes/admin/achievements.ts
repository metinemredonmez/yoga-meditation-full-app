import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN ACHIEVEMENTS ====================
// Frontend expects: /api/admin/achievements
// Provides full CRUD for achievements

// GET /api/admin/achievements - List all achievements
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const isActive = req.query.isActive as string;

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [achievements, total] = await Promise.all([
      prisma.achievements.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.achievements.count({ where }),
    ]);

    res.json({
      achievements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get admin achievements');
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// GET /api/admin/achievements/stats - Get achievement statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byCategory, totalUnlocks] = await Promise.all([
      prisma.achievements.count(),
      prisma.achievements.count({ where: { isActive: true } }),
      prisma.achievements.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.user_achievements.count(),
    ]);

    res.json({
      stats: {
        total,
        active,
        inactive: total - active,
        totalUnlocks,
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get achievement stats');
    res.status(500).json({ error: 'Failed to get achievement stats' });
  }
});

// GET /api/admin/achievements/:id - Get a specific achievement
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const achievement = await prisma.achievements.findUnique({
      where: { id },
      include: {
        _count: {
          select: { user_achievements: true },
        },
      },
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json({ achievement });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get achievement');
    res.status(500).json({ error: 'Failed to get achievement' });
  }
});

// POST /api/admin/achievements - Create a new achievement
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      category,
      iconUrl,
      badgeUrl,
      points,
      xpReward,
      requirement,
      targetValue,
      isSecret,
      isActive,
      sortOrder,
      difficulty,
      requirementType,
      requirementValue,
    } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const achievement = await prisma.achievements.create({
      data: {
        name,
        nameEn,
        slug,
        description,
        descriptionEn,
        category: category || 'GENERAL',
        icon: iconUrl || 'default-icon',
        iconUrl,
        badgeUrl,
        points: points || 0,
        xpReward: xpReward || 0,
        requirement,
        difficulty: difficulty || 'EASY',
        requirementType: requirementType || 'COUNT',
        requirementValue: requirementValue || targetValue || 1,
        targetValue: targetValue || 1,
        isSecret: isSecret ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(achievement);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create achievement');
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

// PUT /api/admin/achievements/:id - Update an achievement
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const achievement = await prisma.achievements.update({
      where: { id },
      data: updateData,
    });

    res.json(achievement);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update achievement');
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// DELETE /api/admin/achievements/:id - Delete an achievement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete user achievements first
    await prisma.user_achievements.deleteMany({ where: { achievementId: id } });
    await prisma.achievements.delete({ where: { id } });

    res.json({ success: true, message: 'Achievement deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete achievement');
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

export default router;
