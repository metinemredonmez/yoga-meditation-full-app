import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const goalTemplateSchema = z.object({
  type: z.enum(['PRACTICE_DAYS', 'PRACTICE_MINUTES', 'MEDITATION_COUNT', 'BREATHWORK_COUNT', 'STREAK', 'MOOD_LOG', 'JOURNAL_ENTRIES', 'SLEEP_TRACKING', 'CUSTOM']),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  targetValue: z.number().min(1),
  unit: z.string().min(1).max(50),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  templateIds: z.array(z.string()),
});

/**
 * @swagger
 * /api/admin/goal-templates:
 *   get:
 *     summary: Get all goal templates
 *     tags: [Admin - Goal Templates]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Goal templates list
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, period, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = type;
    if (period) where.period = period;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [templates, total] = await Promise.all([
      prisma.goal_templates.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.goal_templates.count({ where }),
    ]);

    res.json({
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching goal templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates/{id}:
 *   get:
 *     summary: Get goal template by ID
 *     tags: [Admin - Goal Templates]
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
 *         description: Goal template details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.goal_templates.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Goal template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching goal template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates:
 *   post:
 *     summary: Create goal template
 *     tags: [Admin - Goal Templates]
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
 *         description: Goal template created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = goalTemplateSchema.parse(req.body);

    // Get max sort order
    const maxOrder = await prisma.goal_templates.aggregate({
      _max: { sortOrder: true },
    });

    const template = await prisma.goal_templates.create({
      data: {
        type: validated.type,
        title: validated.title,
        description: validated.description,
        targetValue: validated.targetValue,
        unit: validated.unit,
        period: validated.period,
        icon: validated.icon,
        sortOrder: validated.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
        isActive: validated.isActive ?? true,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error creating goal template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates/{id}:
 *   put:
 *     summary: Update goal template
 *     tags: [Admin - Goal Templates]
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
 *         description: Goal template updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = goalTemplateSchema.partial().parse(req.body);

    const updateData: {
      type?: typeof validated.type;
      title?: string;
      description?: string | null;
      targetValue?: number;
      unit?: string;
      period?: typeof validated.period;
      icon?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (validated.type) updateData.type = validated.type;
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.targetValue) updateData.targetValue = validated.targetValue;
    if (validated.unit) updateData.unit = validated.unit;
    if (validated.period) updateData.period = validated.period;
    if (validated.icon !== undefined) updateData.icon = validated.icon || null;
    if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const template = await prisma.goal_templates.update({
      where: { id },
      data: updateData,
    });

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error updating goal template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates/{id}:
 *   delete:
 *     summary: Delete goal template
 *     tags: [Admin - Goal Templates]
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
 *         description: Goal template deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.goal_templates.delete({
      where: { id },
    });

    res.json({ message: 'Goal template deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates/reorder:
 *   put:
 *     summary: Reorder goal templates
 *     tags: [Admin - Goal Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Templates reordered
 */
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const { templateIds } = reorderSchema.parse(req.body);

    await prisma.$transaction(
      templateIds.map((id, index) =>
        prisma.goal_templates.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    res.json({ message: 'Templates reordered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error reordering goal templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/goal-templates/stats:
 *   get:
 *     summary: Get goal templates statistics
 *     tags: [Admin - Goal Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byType, byPeriod] = await Promise.all([
      prisma.goal_templates.count(),
      prisma.goal_templates.count({ where: { isActive: true } }),
      prisma.goal_templates.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.goal_templates.groupBy({
        by: ['period'],
        _count: true,
      }),
    ]);

    res.json({
      total,
      active,
      inactive: total - active,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      byPeriod: byPeriod.reduce((acc, item) => ({ ...acc, [item.period]: item._count }), {}),
    });
  } catch (error) {
    console.error('Error fetching goal template stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
