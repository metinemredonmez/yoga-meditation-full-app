import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const moodTagSchema = z.object({
  name: z.string().min(1).max(50),
  nameEn: z.string().min(1).max(50).optional(),
  category: z.enum(['ACTIVITY', 'SOCIAL', 'HEALTH', 'WEATHER', 'OTHER']),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * @swagger
 * /api/admin/mood-tags:
 *   get:
 *     summary: Get all mood tags
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood tags list
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, category, isActive, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { nameEn: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.mood_tags.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.mood_tags.count({ where }),
    ]);

    res.json({
      data: tags,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching mood tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags/{id}:
 *   get:
 *     summary: Get mood tag by ID
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood tag details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await prisma.mood_tags.findUnique({
      where: { id },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Mood tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching mood tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags:
 *   post:
 *     summary: Create mood tag
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Mood tag created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = moodTagSchema.parse(req.body);

    const tag = await prisma.mood_tags.create({
      data: {
        name: validated.name,
        nameEn: validated.nameEn,
        category: validated.category,
        icon: validated.icon,
        color: validated.color,
        isActive: validated.isActive ?? true,
      },
    });

    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error creating mood tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags/{id}:
 *   put:
 *     summary: Update mood tag
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Mood tag updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = moodTagSchema.partial().parse(req.body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.nameEn !== undefined) updateData.nameEn = validated.nameEn;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const tag = await prisma.mood_tags.update({
      where: { id },
      data: updateData,
    });

    res.json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error updating mood tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags/{id}:
 *   delete:
 *     summary: Delete mood tag
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood tag deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tag is used in any mood entries
    const usageCount = await prisma.mood_entries.count({
      where: {
        tags: {
          has: id,
        },
      },
    });

    if (usageCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete tag that is in use',
        usageCount,
      });
    }

    await prisma.mood_tags.delete({
      where: { id },
    });

    res.json({ message: 'Mood tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting mood tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags/stats:
 *   get:
 *     summary: Get mood tags statistics
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byCategory] = await Promise.all([
      prisma.mood_tags.count(),
      prisma.mood_tags.count({ where: { isActive: true } }),
      prisma.mood_tags.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    res.json({
      total,
      active,
      inactive: total - active,
      byCategory: byCategory.reduce((acc, item) => ({
        ...acc,
        [item.category || 'UNCATEGORIZED']: item._count,
      }), {}),
    });
  } catch (error) {
    console.error('Error fetching mood tag stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/mood-tags/bulk:
 *   post:
 *     summary: Create multiple mood tags
 *     tags: [Admin - Mood Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *     responses:
 *       201:
 *         description: Mood tags created
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'Tags array is required' });
    }

    const validatedTags = tags.map((tag, index) => {
      try {
        return moodTagSchema.parse(tag);
      } catch (error) {
        throw new Error(`Invalid tag at index ${index}`);
      }
    });

    const created = await prisma.mood_tags.createMany({
      data: validatedTags.map((tag) => ({
        name: tag.name,
        nameEn: tag.nameEn,
        category: tag.category,
        icon: tag.icon,
        color: tag.color,
        isActive: tag.isActive ?? true,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      message: `Created ${created.count} mood tags`,
      count: created.count,
    });
  } catch (error) {
    console.error('Error creating mood tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
