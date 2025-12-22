import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN JOURNAL PROMPTS ====================
// Frontend expects: /api/admin/journal-prompts
// Provides full CRUD for journal prompts

// GET /api/admin/journal-prompts - List all journal prompts
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const category = req.query.category as string;
    const isActive = req.query.isActive as string;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [prompts, total] = await Promise.all([
      prisma.journal_prompts.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journal_prompts.count({ where }),
    ]);

    res.json({
      prompts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get journal prompts');
    res.status(500).json({ error: 'Failed to get journal prompts' });
  }
});

// GET /api/admin/journal-prompts/stats - Get prompt statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byType, byCategory] = await Promise.all([
      prisma.journal_prompts.count(),
      prisma.journal_prompts.count({ where: { isActive: true } }),
      prisma.journal_prompts.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.journal_prompts.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);

    res.json({
      stats: {
        total,
        active,
        inactive: total - active,
        byType: byType.map((t) => ({
          type: t.type,
          count: t._count.id,
        })),
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get journal prompt stats');
    res.status(500).json({ error: 'Failed to get journal prompt stats' });
  }
});

// GET /api/admin/journal-prompts/:id - Get a specific prompt
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prompt = await prisma.journal_prompts.findUnique({
      where: { id },
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Journal prompt not found' });
    }

    res.json({ prompt });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get journal prompt');
    res.status(500).json({ error: 'Failed to get journal prompt' });
  }
});

// POST /api/admin/journal-prompts - Create a new prompt
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      promptEn,
      type,
      category,
      isActive,
      sortOrder,
    } = req.body;

    const newPrompt = await prisma.journal_prompts.create({
      data: {
        prompt,
        promptEn,
        type: type || 'GRATITUDE',
        category,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(newPrompt);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create journal prompt');
    res.status(500).json({ error: 'Failed to create journal prompt' });
  }
});

// PUT /api/admin/journal-prompts/:id - Update a prompt
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const prompt = await prisma.journal_prompts.update({
      where: { id },
      data: updateData,
    });

    res.json(prompt);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update journal prompt');
    res.status(500).json({ error: 'Failed to update journal prompt' });
  }
});

// DELETE /api/admin/journal-prompts/:id - Delete a prompt
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.journal_prompts.delete({ where: { id } });
    res.json({ success: true, message: 'Journal prompt deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete journal prompt');
    res.status(500).json({ error: 'Failed to delete journal prompt' });
  }
});

export default router;
