import {
  BookingStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '../utils/database';

export interface UsageReport {
  generatedAt: string;
  totalUsers: number;
  activeUsersLast7d: number;
  streakDistribution: Array<{ length: number; count: number }>;
  topChallenges: Array<{ id: string; title: string; enrollmentCount: number }>;
}

export interface RevenueReport {
  generatedAt: string;
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  failedPayments: {
    countLast30d: number;
    totalAmountLast30d: number;
    recent: Array<{ id: string; userId: string; amount: number; createdAt: string }>;
  };
}

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

function toISO(date: Date): string {
  return date.toISOString();
}

function normaliseDate(date: Date): string {
  const iso = date.toISOString();
  const [day] = iso.split('T');
  return day ?? iso;
}

function calculateStreakDistribution(
  bookings: Array<{ userId: string; createdAt: Date }>,
): Array<{ length: number; count: number }> {
  const distribution = new Map<number, number>();
  let currentUserId: string | null = null;
  let previousDate: Date | null = null;
  let currentStreak = 0;
  let maxStreak = 0;

  bookings.forEach(({ userId, createdAt }) => {
    if (userId !== currentUserId) {
      if (currentUserId) {
        const finalMax = Math.max(currentStreak, maxStreak);
        if (finalMax > 0) {
          const existing = distribution.get(finalMax) ?? 0;
          distribution.set(finalMax, existing + 1);
        }
      }
      currentUserId = userId;
      previousDate = null;
      currentStreak = 0;
      maxStreak = 0;
    }

    const currentDate = new Date(normaliseDate(createdAt));

    if (!previousDate) {
      currentStreak = 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      previousDate = currentDate;
      return;
    }

    const diff = (currentDate.getTime() - previousDate.getTime()) / MILLISECONDS_IN_DAY;

    if (diff === 0) {
      // Same day booking, ignore for streak continuation but keep previousDate.
      return;
    }

    if (diff === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
      currentStreak = 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    previousDate = currentDate;
  });

  if (currentUserId) {
    const finalMax = Math.max(currentStreak, maxStreak);
    if (finalMax > 0) {
      const existing = distribution.get(finalMax) ?? 0;
      distribution.set(finalMax, existing + 1);
    }
  }

  return Array.from(distribution.entries())
    .sort(([lengthA], [lengthB]) => lengthA - lengthB)
    .map(([length, count]) => ({ length, count }));
}

export async function getUsageReport(): Promise<UsageReport> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * MILLISECONDS_IN_DAY);

  const [totalUsers, activeBookings, streakSourceBookings, topChallengesRaw] = await Promise.all([
    prisma.user.count(),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: BookingStatus.CANCELLED },
      },
      distinct: ['userId'],
      orderBy: { userId: 'asc' },
      select: { userId: true },
    }),
    prisma.booking.findMany({
      where: { status: { not: BookingStatus.CANCELLED } },
      select: { userId: true, createdAt: true },
      orderBy: [
        { userId: 'asc' },
        { createdAt: 'asc' },
      ],
    }),
    prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: {
        enrollments: { _count: 'desc' },
      },
      take: 5,
    }),
  ]);

  const streakDistribution = calculateStreakDistribution(streakSourceBookings);

  const topChallenges = topChallengesRaw
    .filter((challenge) => challenge._count.enrollments > 0)
    .map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      enrollmentCount: challenge._count.enrollments,
    }));

  return {
    generatedAt: toISO(now),
    totalUsers,
    activeUsersLast7d: activeBookings.length,
    streakDistribution,
    topChallenges,
  };
}

export async function getRevenueReport(): Promise<RevenueReport> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MILLISECONDS_IN_DAY);

  const [subscriptionPaymentsThisMonth, activeSubscriptions, failedPaymentsLast30dRaw] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        subscriptionId: { not: null },
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.FAILED,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const mrr = subscriptionPaymentsThisMonth.reduce((total, payment) => total + Number(payment.amount), 0);
  const arr = mrr * 12;

  const failedPaymentsCount = failedPaymentsLast30dRaw.length;
  const failedPaymentsAmount = failedPaymentsLast30dRaw.reduce((total, payment) => total + Number(payment.amount), 0);

  const failedPayments = {
    countLast30d: failedPaymentsCount,
    totalAmountLast30d: failedPaymentsAmount,
    recent: failedPaymentsLast30dRaw.map((payment) => ({
      id: payment.id,
      userId: payment.userId,
      amount: Number(payment.amount),
      createdAt: toISO(payment.createdAt),
    })),
  };

  return {
    generatedAt: toISO(now),
    mrr,
    arr,
    activeSubscriptions,
    failedPayments,
  };
}
