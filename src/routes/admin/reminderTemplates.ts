import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const reminderTemplateSchema = z.object({
  type: z.enum(['MORNING', 'EVENING', 'PRACTICE', 'MOOD', 'JOURNAL', 'HYDRATION', 'POSTURE', 'BREAK', 'BEDTIME', 'CUSTOM']),
  title: z.string().min(1).max(100),
  message: z.string().optional(),
  time: z.string().optional(), // HH:mm format
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  templateIds: z.array(z.string()),
});

/**
 * @swagger
 * /api/admin/reminder-templates:
 *   get:
 *     summary: Get all reminder templates
 *     tags: [Admin - Reminder Templates]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Reminder templates list
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [templates, total] = await Promise.all([
      prisma.reminder_templates.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.reminder_templates.count({ where }),
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
    console.error('Error fetching reminder templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates/{id}:
 *   get:
 *     summary: Get reminder template by ID
 *     tags: [Admin - Reminder Templates]
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
 *         description: Reminder template details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.reminder_templates.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Reminder template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching reminder template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates:
 *   post:
 *     summary: Create reminder template
 *     tags: [Admin - Reminder Templates]
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
 *         description: Reminder template created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = reminderTemplateSchema.parse(req.body);

    // Get max sort order
    const maxOrder = await prisma.reminder_templates.aggregate({
      _max: { sortOrder: true },
    });

    const template = await prisma.reminder_templates.create({
      data: {
        type: validated.type,
        title: validated.title,
        message: validated.message,
        time: validated.time || '09:00',
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
    console.error('Error creating reminder template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates/{id}:
 *   put:
 *     summary: Update reminder template
 *     tags: [Admin - Reminder Templates]
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
 *         description: Reminder template updated
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = reminderTemplateSchema.partial().parse(req.body);

    const template = await prisma.reminder_templates.update({
      where: { id },
      data: validated,
    });

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    console.error('Error updating reminder template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates/{id}:
 *   delete:
 *     summary: Delete reminder template
 *     tags: [Admin - Reminder Templates]
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
 *         description: Reminder template deleted
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reminder_templates.delete({
      where: { id },
    });

    res.json({ message: 'Reminder template deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates/reorder:
 *   put:
 *     summary: Reorder reminder templates
 *     tags: [Admin - Reminder Templates]
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
        prisma.reminder_templates.update({
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
    console.error('Error reordering reminder templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/reminder-templates/stats:
 *   get:
 *     summary: Get reminder templates statistics
 *     tags: [Admin - Reminder Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byType] = await Promise.all([
      prisma.reminder_templates.count(),
      prisma.reminder_templates.count({ where: { isActive: true } }),
      prisma.reminder_templates.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    res.json({
      total,
      active,
      inactive: total - active,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
    });
  } catch (error) {
    console.error('Error fetching reminder template stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
