import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN SUBSCRIPTION PLANS ====================
// Frontend expects: /api/admin/subscription-plans
// Provides full CRUD for subscription plans

// GET /api/admin/subscription-plans - List all subscription plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const tier = req.query.tier as string;
    const isActive = req.query.isActive as string;

    const where: any = {};
    if (tier) where.tier = tier;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [plans, total] = await Promise.all([
      prisma.subscription_plans.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription_plans.count({ where }),
    ]);

    res.json({
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get subscription plans');
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

// GET /api/admin/subscription-plans/stats - Get plan statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, active, byTier, subscriptionCounts] = await Promise.all([
      prisma.subscription_plans.count(),
      prisma.subscription_plans.count({ where: { isActive: true } }),
      prisma.subscription_plans.groupBy({
        by: ['tier'],
        _count: { id: true },
      }),
      prisma.subscriptions.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
    ]);

    res.json({
      stats: {
        total,
        active,
        inactive: total - active,
        byTier: byTier.map((t) => ({
          tier: t.tier,
          count: t._count.id,
        })),
        activeSubscriptionsByPlan: subscriptionCounts.map((s) => ({
          planId: s.planId,
          count: s._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get subscription plan stats');
    res.status(500).json({ error: 'Failed to get subscription plan stats' });
  }
});

// GET /api/admin/subscription-plans/:id - Get a specific plan
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await prisma.subscription_plans.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get subscription plan');
    res.status(500).json({ error: 'Failed to get subscription plan' });
  }
});

// POST /api/admin/subscription-plans - Create a new plan
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      tier,
      priceMonthly,
      priceYearly,
      currency,
      features,
      includedCategories,
      hasAICoach,
      hasOfflineDownload,
      hasLiveClasses,
      hasFamilySharing,
      maxFamilyMembers,
      isActive,
      sortOrder,
    } = req.body;

    const plan = await prisma.subscription_plans.create({
      data: {
        name,
        description,
        tier: tier || 'BASIC',
        priceMonthly: priceMonthly || 0,
        priceYearly: priceYearly || 0,
        currency: currency || 'TRY',
        features: features || [],
        includedCategories: includedCategories || [],
        hasAICoach: hasAICoach ?? false,
        hasOfflineDownload: hasOfflineDownload ?? false,
        hasLiveClasses: hasLiveClasses ?? false,
        hasFamilySharing: hasFamilySharing ?? false,
        maxFamilyMembers: maxFamilyMembers || 1,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create subscription plan');
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
});

// PUT /api/admin/subscription-plans/:id - Update a plan
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const plan = await prisma.subscription_plans.update({
      where: { id },
      data: updateData,
    });

    res.json(plan);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update subscription plan');
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

// DELETE /api/admin/subscription-plans/:id - Delete a plan
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscriptions.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        error: 'Cannot delete plan with active subscriptions',
        activeSubscriptions,
      });
    }

    await prisma.subscription_plans.delete({ where: { id } });
    res.json({ success: true, message: 'Subscription plan deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete subscription plan');
    res.status(500).json({ error: 'Failed to delete subscription plan' });
  }
});

export default router;
