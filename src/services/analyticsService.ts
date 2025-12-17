import { prisma } from '../utils/database';
import {
  Prisma,
  PaymentProvider,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionInterval,
  RevenueType,
} from '@prisma/client';
import { logger } from '../utils/logger';

export interface AnalyticsMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  avgLtv: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  subscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
}

export interface ProviderBreakdown {
  provider: PaymentProvider;
  revenue: number;
  subscriptions: number;
  percentage: number;
}

export interface TierBreakdown {
  tier: SubscriptionTier;
  count: number;
  revenue: number;
  percentage: number;
}

/**
 * Calculate Monthly Recurring Revenue (MRR)
 */
export async function calculateMRR(): Promise<number> {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
    include: {
      plan: true,
    },
  });

  let mrr = 0;
  for (const sub of activeSubscriptions) {
    if (sub.interval === SubscriptionInterval.MONTHLY) {
      mrr += Number(sub.plan.priceMonthly);
    } else if (sub.interval === SubscriptionInterval.YEARLY) {
      // Convert yearly to monthly
      mrr += Number(sub.plan.priceYearly) / 12;
    }
  }

  return mrr;
}

/**
 * Calculate Annual Recurring Revenue (ARR)
 */
export async function calculateARR(): Promise<number> {
  const mrr = await calculateMRR();
  return mrr * 12;
}

/**
 * Calculate churn rate for a given period
 */
export async function calculateChurnRate(
  startDate: Date,
  endDate: Date
): Promise<{ rate: number; churned: number; startingCount: number }> {
  // Count subscriptions at the start of the period
  const startingSubscriptions = await prisma.subscription.count({
    where: {
      createdAt: { lt: startDate },
      OR: [
        { status: SubscriptionStatus.ACTIVE },
        {
          cancelledAt: { gte: startDate },
        },
      ],
    },
  });

  // Count churned subscriptions during the period
  const churnedSubscriptions = await prisma.subscription.count({
    where: {
      cancelledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED],
      },
    },
  });

  const churnRate = startingSubscriptions > 0 ? churnedSubscriptions / startingSubscriptions : 0;

  return {
    rate: churnRate,
    churned: churnedSubscriptions,
    startingCount: startingSubscriptions,
  };
}

/**
 * Calculate Customer Lifetime Value (LTV)
 */
export async function calculateLTV(): Promise<number> {
  // Get all completed payments
  const payments = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  // Get total unique paying users
  const uniquePayingUsers = await prisma.payment.groupBy({
    by: ['userId'],
    where: {
      status: 'COMPLETED',
    },
  });

  const totalRevenue = Number(payments._sum.amount) || 0;
  const uniqueCustomers = uniquePayingUsers.length;

  if (uniqueCustomers === 0) return 0;

  // Simple LTV calculation: total revenue / unique customers
  return totalRevenue / uniqueCustomers;
}

/**
 * Calculate average subscription length in days
 */
export async function calculateAvgSubscriptionLength(): Promise<number> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      cancelledAt: { not: null },
    },
    select: {
      createdAt: true,
      cancelledAt: true,
    },
  });

  if (subscriptions.length === 0) return 0;

  const totalDays = subscriptions.reduce((sum, sub) => {
    if (sub.cancelledAt) {
      const days = Math.floor(
        (sub.cancelledAt.getTime() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }
    return sum;
  }, 0);

  return Math.round(totalDays / subscriptions.length);
}

/**
 * Get revenue by provider
 */
export async function getRevenueByProvider(): Promise<ProviderBreakdown[]> {
  const result = await prisma.payment.groupBy({
    by: ['provider'],
    where: {
      status: 'COMPLETED',
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  const total = result.reduce((sum, r) => sum + (Number(r._sum.amount) || 0), 0);

  return result.map((r) => ({
    provider: r.provider,
    revenue: Number(r._sum.amount) || 0,
    subscriptions: r._count,
    percentage: total > 0 ? ((Number(r._sum.amount) || 0) / total) * 100 : 0,
  }));
}

/**
 * Get subscriptions by tier
 */
export async function getSubscriptionsByTier(): Promise<TierBreakdown[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
    include: {
      plan: true,
    },
  });

  const tierCounts: Record<SubscriptionTier, { count: number; revenue: number }> = {
    FREE: { count: 0, revenue: 0 },
    BASIC: { count: 0, revenue: 0 },
    PREMIUM: { count: 0, revenue: 0 },
    ENTERPRISE: { count: 0, revenue: 0 },
  };

  for (const sub of subscriptions) {
    const tier = sub.plan.tier;
    tierCounts[tier].count++;
    if (sub.interval === SubscriptionInterval.MONTHLY) {
      tierCounts[tier].revenue += Number(sub.plan.priceMonthly);
    } else {
      tierCounts[tier].revenue += Number(sub.plan.priceYearly) / 12;
    }
  }

  const total = subscriptions.length;

  return Object.entries(tierCounts).map(([tier, data]) => ({
    tier: tier as SubscriptionTier,
    count: data.count,
    revenue: data.revenue,
    percentage: total > 0 ? (data.count / total) * 100 : 0,
  }));
}

/**
 * Get revenue over time
 */
export async function getRevenueOverTime(
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'month'
): Promise<RevenueByPeriod[]> {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      paidAt: true,
      subscriptionId: true,
    },
    orderBy: {
      paidAt: 'asc',
    },
  });

  const newSubs = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  const churnedSubs = await prisma.subscription.findMany({
    where: {
      cancelledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      cancelledAt: true,
    },
  });

  const periods: Map<string, RevenueByPeriod> = new Map();

  const formatPeriod = (date: Date): string => {
    if (groupBy === 'day') {
      return date.toISOString().split('T')[0] as string;
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0] as string;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  // Process payments
  for (const payment of payments) {
    if (payment.paidAt) {
      const period = formatPeriod(payment.paidAt);
      const existing = periods.get(period) || {
        period,
        revenue: 0,
        subscriptions: 0,
        newSubscriptions: 0,
        churnedSubscriptions: 0,
      };
      existing.revenue += Number(payment.amount);
      if (payment.subscriptionId) {
        existing.subscriptions++;
      }
      periods.set(period, existing);
    }
  }

  // Process new subscriptions
  for (const sub of newSubs) {
    const period = formatPeriod(sub.createdAt);
    const existing = periods.get(period) || {
      period,
      revenue: 0,
      subscriptions: 0,
      newSubscriptions: 0,
      churnedSubscriptions: 0,
    };
    existing.newSubscriptions++;
    periods.set(period, existing);
  }

  // Process churned subscriptions
  for (const sub of churnedSubs) {
    if (sub.cancelledAt) {
      const period = formatPeriod(sub.cancelledAt);
      const existing = periods.get(period) || {
        period,
        revenue: 0,
        subscriptions: 0,
        newSubscriptions: 0,
        churnedSubscriptions: 0,
      };
      existing.churnedSubscriptions++;
      periods.set(period, existing);
    }
  }

  return Array.from(periods.values()).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get user metrics
 */
export async function getUserMetrics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setDate(today.getDate() - 30);

  const [totalUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth, activeUsersToday] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: thisWeek },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: thisMonth },
        },
      }),
      // Active users = users who have video progress today
      prisma.videoProgress.groupBy({
        by: ['userId'],
        where: {
          lastWatchedAt: { gte: today },
        },
      }),
    ]);

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    dailyActiveUsers: activeUsersToday.length,
  };
}

/**
 * Get subscription metrics
 */
export async function getSubscriptionMetrics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(today);
  thisMonth.setMonth(today.getMonth() - 1);

  const [
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    newSubscriptionsThisMonth,
    cancelledThisMonth,
  ] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.TRIALING,
      },
    }),
    prisma.subscription.count({
      where: {
        createdAt: { gte: thisMonth },
      },
    }),
    prisma.subscription.count({
      where: {
        cancelledAt: { gte: thisMonth },
        status: {
          in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.CANCELED],
        },
      },
    }),
  ]);

  return {
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    newSubscriptionsThisMonth,
    cancelledThisMonth,
  };
}

/**
 * Record a revenue event
 */
export async function recordRevenue(data: {
  userId?: string;
  subscriptionId?: string;
  paymentId?: string;
  invoiceId?: string;
  type: RevenueType;
  amount: number;
  currency?: string;
  provider?: PaymentProvider;
  planId?: string;
  tier?: SubscriptionTier;
  interval?: SubscriptionInterval;
  metadata?: Record<string, unknown>;
}) {
  // Calculate MRR contribution
  let mrrContribution = data.amount;
  if (data.type === RevenueType.REFUND) {
    mrrContribution = -Math.abs(data.amount);
  } else if (data.interval === SubscriptionInterval.YEARLY) {
    mrrContribution = data.amount / 12;
  }

  const record = await prisma.revenueRecord.create({
    data: {
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      type: data.type,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency || 'TRY',
      provider: data.provider,
      planId: data.planId,
      tier: data.tier,
      interval: data.interval,
      mrr: new Prisma.Decimal(mrrContribution),
      metadata: data.metadata as Prisma.InputJsonValue,
    },
  });

  logger.info({ recordId: record.id, type: data.type, amount: data.amount }, 'Revenue recorded');
  return record;
}

/**
 * Get revenue records
 */
export async function getRevenueRecords(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: RevenueType;
  provider?: PaymentProvider;
  tier?: SubscriptionTier;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.RevenueRecordWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.recordedAt = {};
    if (filters.startDate) {
      where.recordedAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.recordedAt.lte = filters.endDate;
    }
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.provider) {
    where.provider = filters.provider;
  }
  if (filters.tier) {
    where.tier = filters.tier;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.revenueRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.revenueRecord.count({ where }),
  ]);

  return {
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create or update daily analytics snapshot
 */
export async function createDailySnapshot(date?: Date) {
  const targetDate = date || new Date();
  const snapshotDate = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  // Calculate all metrics
  const [
    mrr,
    userMetrics,
    subscriptionMetrics,
    revenueByProvider,
    subscriptionsByTier,
    churnData,
    ltv,
    avgSubLength,
  ] = await Promise.all([
    calculateMRR(),
    getUserMetrics(),
    getSubscriptionMetrics(),
    getRevenueByProvider(),
    getSubscriptionsByTier(),
    calculateChurnRate(
      new Date(snapshotDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      snapshotDate
    ),
    calculateLTV(),
    calculateAvgSubscriptionLength(),
  ]);

  // Get today's revenue
  const todayStart = new Date(snapshotDate);
  const todayEnd = new Date(snapshotDate);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayRevenue = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      paidAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    _sum: { amount: true },
  });

  const refundedAmount = await prisma.refund.aggregate({
    where: {
      status: 'SUCCEEDED',
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    _sum: { amount: true },
  });

  // Calculate total revenue
  const totalRevenue = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
    },
    _sum: { amount: true },
  });

  // Transform provider breakdown to JSON
  const revenueByProviderJson: Record<string, number> = {};
  for (const p of revenueByProvider) {
    revenueByProviderJson[p.provider] = p.revenue;
  }

  const subscriptionsByTierJson: Record<string, number> = {};
  for (const t of subscriptionsByTier) {
    subscriptionsByTierJson[t.tier] = t.count;
  }

  // Provider subscription counts
  const subsByProvider = await prisma.subscription.groupBy({
    by: ['provider'],
    where: {
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
    _count: true,
  });

  const subscriptionsByProviderJson: Record<string, number> = {};
  for (const s of subsByProvider) {
    subscriptionsByProviderJson[s.provider] = s._count;
  }

  // Upsert snapshot
  const snapshot = await prisma.analyticsSnapshot.upsert({
    where: { date: snapshotDate },
    update: {
      totalUsers: userMetrics.totalUsers,
      newUsers: userMetrics.newUsersToday,
      activeUsers: userMetrics.dailyActiveUsers,
      totalSubscriptions: subscriptionMetrics.totalSubscriptions,
      activeSubscriptions: subscriptionMetrics.activeSubscriptions,
      newSubscriptions: subscriptionMetrics.newSubscriptionsThisMonth,
      cancelledSubscriptions: subscriptionMetrics.cancelledThisMonth,
      trialSubscriptions: subscriptionMetrics.trialSubscriptions,
      mrr: new Prisma.Decimal(mrr),
      arr: new Prisma.Decimal(mrr * 12),
      totalRevenue: new Prisma.Decimal(Number(totalRevenue._sum.amount) || 0),
      newRevenue: new Prisma.Decimal(Number(todayRevenue._sum.amount) || 0),
      refundedAmount: new Prisma.Decimal(Number(refundedAmount._sum.amount) || 0),
      churnRate: new Prisma.Decimal(churnData.rate),
      churnedSubscriptions: churnData.churned,
      churnedMrr: new Prisma.Decimal(0), // Would need more calculation
      avgLtv: new Prisma.Decimal(ltv),
      avgSubscriptionLength: avgSubLength,
      revenueByProvider: revenueByProviderJson,
      subscriptionsByTier: subscriptionsByTierJson,
      subscriptionsByProvider: subscriptionsByProviderJson,
      dailyActiveUsers: userMetrics.dailyActiveUsers,
      weeklyActiveUsers: 0, // Would need more calculation
      monthlyActiveUsers: 0, // Would need more calculation
    },
    create: {
      date: snapshotDate,
      totalUsers: userMetrics.totalUsers,
      newUsers: userMetrics.newUsersToday,
      activeUsers: userMetrics.dailyActiveUsers,
      totalSubscriptions: subscriptionMetrics.totalSubscriptions,
      activeSubscriptions: subscriptionMetrics.activeSubscriptions,
      newSubscriptions: subscriptionMetrics.newSubscriptionsThisMonth,
      cancelledSubscriptions: subscriptionMetrics.cancelledThisMonth,
      trialSubscriptions: subscriptionMetrics.trialSubscriptions,
      mrr: new Prisma.Decimal(mrr),
      arr: new Prisma.Decimal(mrr * 12),
      totalRevenue: new Prisma.Decimal(Number(totalRevenue._sum.amount) || 0),
      newRevenue: new Prisma.Decimal(Number(todayRevenue._sum.amount) || 0),
      refundedAmount: new Prisma.Decimal(Number(refundedAmount._sum.amount) || 0),
      churnRate: new Prisma.Decimal(churnData.rate),
      churnedSubscriptions: churnData.churned,
      churnedMrr: new Prisma.Decimal(0),
      avgLtv: new Prisma.Decimal(ltv),
      avgSubscriptionLength: avgSubLength,
      revenueByProvider: revenueByProviderJson,
      subscriptionsByTier: subscriptionsByTierJson,
      subscriptionsByProvider: subscriptionsByProviderJson,
      dailyActiveUsers: userMetrics.dailyActiveUsers,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
    },
  });

  logger.info({ snapshotId: snapshot.id, date: snapshotDate }, 'Analytics snapshot created');
  return snapshot;
}

/**
 * Get analytics snapshots over time
 */
export async function getAnalyticsSnapshots(startDate: Date, endDate: Date) {
  return prisma.analyticsSnapshot.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get the latest analytics snapshot
 */
export async function getLatestSnapshot() {
  return prisma.analyticsSnapshot.findFirst({
    orderBy: { date: 'desc' },
  });
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics() {
  const [mrr, arr, ltv, userMetrics, subscriptionMetrics, revenueByProvider, subscriptionsByTier] =
    await Promise.all([
      calculateMRR(),
      calculateARR(),
      calculateLTV(),
      getUserMetrics(),
      getSubscriptionMetrics(),
      getRevenueByProvider(),
      getSubscriptionsByTier(),
    ]);

  // Get last 30 days of snapshots for trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const snapshots = await getAnalyticsSnapshots(thirtyDaysAgo, new Date());

  // Calculate MRR growth
  let mrrGrowth = 0;
  if (snapshots.length >= 2) {
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (firstSnapshot && lastSnapshot) {
      const oldMrr = Number(firstSnapshot.mrr);
      const newMrr = Number(lastSnapshot.mrr);
      if (oldMrr > 0) {
        mrrGrowth = ((newMrr - oldMrr) / oldMrr) * 100;
      }
    }
  }

  return {
    revenue: {
      mrr,
      arr,
      mrrGrowth,
      ltv,
    },
    users: userMetrics,
    subscriptions: subscriptionMetrics,
    breakdown: {
      byProvider: revenueByProvider,
      byTier: subscriptionsByTier,
    },
    trend: snapshots.map((s) => ({
      date: s.date,
      mrr: Number(s.mrr),
      activeSubscriptions: s.activeSubscriptions,
      newUsers: s.newUsers,
    })),
  };
}
