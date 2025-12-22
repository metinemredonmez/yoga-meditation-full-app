import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';

const router = Router();

// Authentication is handled by parent admin router

// ==================== ADMIN BILLING ====================
// Frontend expects: /api/admin/billing
// Provides billing overview for admin dashboard

// GET /api/admin/billing/overview - Get billing overview for current user/tenant
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get user's subscription with plan details
    const subscription = await prisma.subscriptions.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get recent invoices
    const invoices = await prisma.invoices.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate next billing date
    const nextBillingDate = subscription?.currentPeriodEnd;

    res.json({
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan
              ? {
                  id: subscription.plan.id,
                  name: subscription.plan.name,
                  tier: subscription.plan.tier,
                  priceMonthly: subscription.plan.priceMonthly,
                  priceYearly: subscription.plan.priceYearly,
                  currency: subscription.plan.currency,
                  features: subscription.plan.features,
                }
              : null,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            interval: subscription.interval,
          }
        : null,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        amountDue: inv.amountDue,
        amountPaid: inv.amountPaid,
        currency: inv.currency,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
      })),
      nextBillingDate,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get billing overview');
    res.status(500).json({ error: 'Failed to get billing overview' });
  }
});

// GET /api/admin/billing/stats - Get billing statistics (super admin only)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByStatus,
      subscriptionsByTier,
      monthlyRevenue,
      yearlyRevenue,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
    ] = await Promise.all([
      prisma.subscriptions.count(),
      prisma.subscriptions.count({
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      }),
      prisma.subscriptions.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.subscriptions.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
      prisma.invoices.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amountPaid: true },
      }),
      prisma.invoices.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: startOfYear },
        },
        _sum: { amountPaid: true },
      }),
      prisma.invoices.count(),
      prisma.invoices.count({ where: { status: 'PAID' } }),
      prisma.invoices.count({ where: { status: { in: ['DRAFT', 'PENDING'] } } }),
    ]);

    // Get plan details for tier breakdown
    const plans = await prisma.subscription_plans.findMany({
      select: { id: true, name: true, tier: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p]));

    res.json({
      stats: {
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          byStatus: subscriptionsByStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
          })),
          byTier: subscriptionsByTier.map((s) => ({
            planId: s.planId,
            planName: planMap.get(s.planId)?.name || 'Unknown',
            tier: planMap.get(s.planId)?.tier || 'UNKNOWN',
            count: s._count.id,
          })),
        },
        revenue: {
          monthly: monthlyRevenue._sum.amountPaid || 0,
          yearly: yearlyRevenue._sum.amountPaid || 0,
          currency: 'TRY',
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get billing stats');
    res.status(500).json({ error: 'Failed to get billing stats' });
  }
});

// GET /api/admin/billing/invoices - List all invoices
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const userId = req.query.userId as string;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        include: {
          users: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          subscriptions: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoices.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get invoices');
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// GET /api/admin/billing/invoices/:id - Get a specific invoice
router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoices.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        subscriptions: {
          include: { plan: true },
        },
        invoice_items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get invoice');
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// GET /api/admin/billing/subscriptions - List all subscriptions
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          users: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          plan: {
            select: { id: true, name: true, tier: true, priceMonthly: true, priceYearly: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptions.count({ where }),
    ]);

    res.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get subscriptions');
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// GET /api/admin/billing/subscriptions/:id - Get a specific subscription
router.get('/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscriptions.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscription });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get subscription');
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

export default router;
