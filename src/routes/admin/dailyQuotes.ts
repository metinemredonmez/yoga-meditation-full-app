import { Router, Request, Response } from 'express';
import * as dailyContentController from '../../controllers/dailyContentController';
import { prisma } from '../../utils/database';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== DAILY QUOTES ====================
// This route wraps the dailyContentController quotes endpoints
// Frontend expects: /api/admin/daily-quotes
// This provides: GET, POST, GET/:id, PUT/:id, DELETE/:id

router.get('/', dailyContentController.getQuotes);
router.post('/', dailyContentController.createQuote);

// Stats endpoint for daily quotes
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byCategory] = await Promise.all([
      prisma.daily_quotes.count(),
      prisma.daily_quotes.count({ where: { isActive: true } }),
      prisma.daily_quotes.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);

    res.json({
      stats: {
        total,
        active,
        inactive: total - active,
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quote stats' });
  }
});

router.get('/:id', dailyContentController.getQuote);
router.put('/:id', dailyContentController.updateQuote);
router.delete('/:id', dailyContentController.deleteQuote);

export default router;
