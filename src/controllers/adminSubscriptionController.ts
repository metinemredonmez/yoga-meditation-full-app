import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { SubscriptionTier } from '@prisma/client';

/**
 * Grant premium subscription to a user
 * POST /api/admin/subscriptions/grant
 */
export const grantSubscription = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { userId, tier, durationMonths, reason } = req.body;

    if (!userId || !tier) {
      return res.status(400).json({
        success: false,
        error: 'userId ve tier gerekli',
      });
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['FREE', 'PREMIUM', 'FAMILY'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz tier. Gecerli degerler: FREE, PREMIUM, FAMILY',
      });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    // Calculate expiration date
    const months = durationMonths || 12; // Default to 1 year
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Find or create the subscription plan for this tier
    let plan = await prisma.subscription_plans.findFirst({
      where: { tier },
    });

    if (!plan) {
      // Create a default plan for the tier
      plan = await prisma.subscription_plans.create({
        data: {
          name: tier === 'PREMIUM' ? 'Premium Plan' : tier === 'FAMILY' ? 'Family Plan' : 'Free Plan',
          tier,
          priceMonthly: tier === 'PREMIUM' ? 9.99 : tier === 'FAMILY' ? 14.99 : 0,
          priceYearly: tier === 'PREMIUM' ? 99.99 : tier === 'FAMILY' ? 149.99 : 0,
          features: tier === 'FREE' ? ['basic_content'] : ['all_content', 'offline_access', 'no_ads'],
          description: `${tier} subscription plan`,
          isActive: true,
        },
      });
    }

    // Deactivate any existing active subscriptions
    await prisma.subscriptions.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Admin tarafindan yeni abonelik verildi',
      },
    });

    // Create new manual subscription
    const subscription = await prisma.subscriptions.create({
      data: {
        userId,
        planId: plan.id,
        provider: 'MANUAL',
        status: 'ACTIVE',
        interval: 'YEARLY',
        isManual: true,
        grantedBy: adminId,
        grantedAt: new Date(),
        grantReason: reason || 'Admin tarafindan verildi',
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt,
        autoRenew: false,
      },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update user's subscription tier cache
    await prisma.users.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Log the action
    await prisma.admin_audit_logs.create({
      data: {
        adminId: adminId,
        action: 'SUBSCRIPTION_GRANTED',
        entityType: 'subscription',
        entityId: subscription.id,
        metadata: {
          targetUserId: userId,
          tier,
          durationMonths: months,
          reason,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: `${tier} aboneligi basariyla verildi`,
      subscription: {
        id: subscription.id,
        tier: subscription.plan.tier,
        expiresAt: subscription.currentPeriodEnd,
        isManual: subscription.isManual,
        grantReason: subscription.grantReason,
        user: subscription.users,
      },
    });
  } catch (error) {
    console.error('Grant subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Abonelik verilemedi',
    });
  }
};

/**
 * Revoke subscription from a user
 * POST /api/admin/subscriptions/revoke
 */
export const revokeSubscription = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId gerekli',
      });
    }

    // Find user's active subscription
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Aktif abonelik bulunamadi',
      });
    }

    // Revoke the subscription
    const revokedSubscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        revokedBy: adminId,
        revokedAt: new Date(),
        revokeReason: reason || 'Admin tarafindan iptal edildi',
        cancelledAt: new Date(),
        cancelReason: reason || 'Admin tarafindan iptal edildi',
      },
    });

    // Update user's subscription tier to FREE
    await prisma.users.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });

    // Log the action
    await prisma.admin_audit_logs.create({
      data: {
        adminId: adminId,
        action: 'SUBSCRIPTION_REVOKED',
        entityType: 'subscription',
        entityId: subscription.id,
        metadata: {
          targetUserId: userId,
          previousTier: subscription.plan.tier,
          reason,
        },
      },
    });

    res.json({
      success: true,
      message: 'Abonelik basariyla iptal edildi',
      subscription: {
        id: revokedSubscription.id,
        status: revokedSubscription.status,
        revokedAt: revokedSubscription.revokedAt,
        revokeReason: revokedSubscription.revokeReason,
      },
    });
  } catch (error) {
    console.error('Revoke subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Abonelik iptal edilemedi',
    });
  }
};

/**
 * Extend subscription duration
 * POST /api/admin/subscriptions/extend
 */
export const extendSubscription = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { userId, additionalMonths, reason } = req.body;

    if (!userId || !additionalMonths) {
      return res.status(400).json({
        success: false,
        error: 'userId ve additionalMonths gerekli',
      });
    }

    // Find user's active subscription
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Aktif abonelik bulunamadi',
      });
    }

    // Calculate new expiration date
    const currentEnd = subscription.currentPeriodEnd || new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + additionalMonths);

    // Update subscription
    const updatedSubscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: newEnd,
        grantReason: subscription.grantReason
          ? `${subscription.grantReason} | Uzatildi: ${reason || 'Admin tarafindan'}`
          : `Uzatildi: ${reason || 'Admin tarafindan'}`,
      },
    });

    // Update user's expiration date
    await prisma.users.update({
      where: { id: userId },
      data: {
        subscriptionExpiresAt: newEnd,
      },
    });

    // Log the action
    await prisma.admin_audit_logs.create({
      data: {
        adminId: adminId,
        action: 'SUBSCRIPTION_EXTENDED',
        entityType: 'subscription',
        entityId: subscription.id,
        metadata: {
          targetUserId: userId,
          additionalMonths,
          previousEnd: currentEnd.toISOString(),
          newEnd: newEnd.toISOString(),
          reason,
        },
      },
    });

    res.json({
      success: true,
      message: `Abonelik ${additionalMonths} ay uzatildi`,
      subscription: {
        id: updatedSubscription.id,
        newExpiresAt: updatedSubscription.currentPeriodEnd,
        previousExpiresAt: currentEnd,
      },
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Abonelik uzatilamadi',
    });
  }
};

/**
 * Get user's subscription details
 * GET /api/admin/subscriptions/user/:userId
 */
export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        subscriptions: {
          include: {
            plan: true,
            grantedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            revokedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanici bulunamadi',
      });
    }

    const activeSubscription = user.subscriptions.find(s => s.status === 'ACTIVE');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currentTier: user.subscriptionTier,
        expiresAt: user.subscriptionExpiresAt,
      },
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            tier: activeSubscription.plan.tier,
            provider: activeSubscription.provider,
            isManual: activeSubscription.isManual,
            grantedBy: activeSubscription.grantedByUser,
            grantedAt: activeSubscription.grantedAt,
            grantReason: activeSubscription.grantReason,
            expiresAt: activeSubscription.currentPeriodEnd,
            autoRenew: activeSubscription.autoRenew,
          }
        : null,
      subscriptionHistory: user.subscriptions.map(s => ({
        id: s.id,
        tier: s.plan.tier,
        status: s.status,
        provider: s.provider,
        isManual: s.isManual,
        grantedAt: s.grantedAt,
        grantReason: s.grantReason,
        revokedAt: s.revokedAt,
        revokeReason: s.revokeReason,
        startDate: s.currentPeriodStart,
        endDate: s.currentPeriodEnd,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Abonelik bilgileri alinamadi',
    });
  }
};

/**
 * List all subscriptions with filters
 * GET /api/admin/subscriptions
 */
export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      tier,
      status,
      isManual,
      provider,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (tier) where.plan = { tier };
    if (status) where.status = status;
    if (isManual !== undefined) where.isManual = isManual === 'true';
    if (provider) where.provider = provider;

    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plan: true,
          grantedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscriptions.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscriptions.map(s => ({
        id: s.id,
        user: s.users,
        tier: s.plan.tier,
        planName: s.plan.name,
        status: s.status,
        provider: s.provider,
        isManual: s.isManual,
        grantedBy: s.grantedByUser,
        grantedAt: s.grantedAt,
        grantReason: s.grantReason,
        expiresAt: s.currentPeriodEnd,
        autoRenew: s.autoRenew,
        createdAt: s.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Abonelikler listelenemedi',
    });
  }
};

/**
 * Get subscription statistics
 * GET /api/admin/subscriptions/stats
 */
export const getSubscriptionStats = async (req: Request, res: Response) => {
  try {
    const [
      totalActive,
      totalManual,
      byTier,
      byProvider,
      recentGrants,
      expiringThisMonth,
    ] = await Promise.all([
      // Total active subscriptions
      prisma.subscriptions.count({
        where: { status: 'ACTIVE' },
      }),
      // Total manual subscriptions
      prisma.subscriptions.count({
        where: { status: 'ACTIVE', isManual: true },
      }),
      // By tier
      prisma.subscriptions.groupBy({
        by: ['status'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
      // By provider
      prisma.subscriptions.groupBy({
        by: ['provider'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
      // Recent grants (last 7 days)
      prisma.subscriptions.count({
        where: {
          isManual: true,
          grantedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Expiring this month
      prisma.subscriptions.count({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: new Date(),
            lte: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
        },
      }),
    ]);

    // Get tier distribution from users table
    const tierDistribution = await prisma.users.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });

    res.json({
      success: true,
      stats: {
        totalActive,
        totalManual,
        totalPaid: totalActive - totalManual,
        recentGrants,
        expiringThisMonth,
        tierDistribution: tierDistribution.reduce((acc, t) => {
          acc[t.subscriptionTier] = t._count.id;
          return acc;
        }, {} as Record<string, number>),
        providerDistribution: byProvider.reduce((acc, p) => {
          acc[p.provider] = p._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Istatistikler alinamadi',
    });
  }
};
