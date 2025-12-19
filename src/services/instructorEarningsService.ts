import {
  EarningType,
  EarningSourceType,
  EarningStatus,
  InstructorTier,
  Prisma,
} from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { calculateTierBenefits } from './instructorService';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// Types
// ============================================

interface RecordEarningInput {
  instructorId: string;
  type: EarningType;
  sourceType: EarningSourceType;
  sourceId?: string;
  grossAmount: number;
  studentId?: string;
  description?: string;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, unknown>;
}

interface EarningFilters {
  type?: EarningType;
  sourceType?: EarningSourceType;
  status?: EarningStatus;
  startDate?: Date;
  endDate?: Date;
}

interface EarningSummary {
  totalGross: number;
  totalPlatformFee: number;
  totalNet: number;
  pendingAmount: number;
  confirmedAmount: number;
  paidAmount: number;
  earningsByType: Record<string, number>;
}

// ============================================
// Revenue Split Calculation
// ============================================

interface InstructorShareResult {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  platformRate: number;
  instructorRate: number;
}

/**
 * Calculate instructor share based on tier and commission rate
 */
export function calculateInstructorShare(
  grossAmount: number,
  commissionRate: number,
  tier: InstructorTier,
  customPayoutRate?: number | null,
): InstructorShareResult {
  const benefits = calculateTierBenefits(tier);

  // Use custom payout rate if set, otherwise calculate from commission
  let instructorRate: number;
  if (customPayoutRate !== null && customPayoutRate !== undefined) {
    instructorRate = customPayoutRate;
  } else {
    // Base instructor rate
    const baseRate = 1 - commissionRate;
    // Add tier bonus (but don't exceed 1.0)
    instructorRate = Math.min(baseRate + benefits.tierBonus, 1.0);
  }

  const platformRate = 1 - instructorRate;
  const platformFee = grossAmount * platformRate;
  const netAmount = grossAmount * instructorRate;

  return {
    grossAmount,
    platformFee: Math.round(platformFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    platformRate,
    instructorRate,
  };
}

// ============================================
// Earning Recording
// ============================================

/**
 * Record an earning for an instructor
 */
export async function recordEarning(input: RecordEarningInput) {
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: input.instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Calculate split
  const split = calculateInstructorShare(
    input.grossAmount,
    Number(instructor.commissionRate),
    instructor.tier,
    instructor.customPayoutRate ? Number(instructor.customPayoutRate) : null,
  );

  const earning = await prisma.instructor_earnings.create({
    data: {
      instructorId: input.instructorId,
      type: input.type,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      studentId: input.studentId,
      grossAmount: split.grossAmount,
      platformFee: split.platformFee,
      netAmount: split.netAmount,
      description: input.description,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: 'PENDING',
      metadata: input.metadata as Prisma.InputJsonValue,
    },
  });

  logger.info(
    {
      earningId: earning.id,
      instructorId: input.instructorId,
      type: input.type,
      grossAmount: split.grossAmount,
      netAmount: split.netAmount,
    },
    'Instructor earning recorded',
  );

  return earning;
}

/**
 * Calculate and record earning for a program view/purchase
 */
export async function calculateProgramEarning(
  programId: string,
  paymentAmount: number,
  studentId?: string,
) {
  const program = await prisma.programs.findUnique({
    where: { id: programId },
  });

  if (!program || !program.instructorId) {
    logger.warn({ programId }, 'Program not found or has no instructor');
    return null;
  }

  // Get instructor profile
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { userId: program.instructorId },
  });

  if (!instructor) {
    logger.warn({ programId, userId: program.instructorId }, 'Instructor profile not found');
    return null;
  }

  // Check for custom revenue share
  const revenueShare = program.revenueShare as Record<string, number> | null;

  if (revenueShare && Object.keys(revenueShare).length > 0) {
    // Custom revenue share - split among multiple instructors
    const earnings = [];

    for (const [instructorUserId, percentage] of Object.entries(revenueShare)) {
      const instructorProfile = await prisma.instructor_profiles.findUnique({
        where: { userId: instructorUserId },
      });

      if (instructorProfile) {
        const share = paymentAmount * (percentage / 100);
        const earning = await recordEarning({
          instructorId: instructorProfile.id,
          type: 'PROGRAM_VIEW',
          sourceType: 'PROGRAM',
          sourceId: programId,
          grossAmount: share,
          studentId,
          description: `Program purchase: ${program.title}`,
          metadata: { programId, revenueSharePercentage: percentage },
        });
        earnings.push(earning);
      }
    }

    return earnings;
  }

  // Standard earning for primary instructor
  return recordEarning({
    instructorId: instructor.id,
    type: 'PROGRAM_VIEW',
    sourceType: 'PROGRAM',
    sourceId: programId,
    grossAmount: paymentAmount,
    studentId,
    description: `Program purchase: ${program.title}`,
    metadata: { programId },
  });
}

/**
 * Calculate and record earning for a class booking
 */
export async function calculateClassEarning(
  classId: string,
  bookingAmount: number,
  studentId?: string,
) {
  const classItem = await prisma.classes.findUnique({
    where: { id: classId },
  });

  if (!classItem) {
    logger.warn({ classId }, 'Class not found');
    return null;
  }

  // Get instructor profile
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { userId: classItem.instructorId },
  });

  if (!instructor) {
    logger.warn({ classId, userId: classItem.instructorId }, 'Instructor profile not found');
    return null;
  }

  return recordEarning({
    instructorId: instructor.id,
    type: 'CLASS_BOOKING',
    sourceType: 'CLASS',
    sourceId: classId,
    grossAmount: bookingAmount,
    studentId,
    description: `Class booking: ${classItem.title}`,
    metadata: { classId },
  });
}

/**
 * Calculate and distribute subscription share among instructors
 */
export async function calculateSubscriptionShare(
  subscriptionAmount: number,
  periodStart: Date,
  periodEnd: Date,
  distributionMethod: 'equal' | 'viewBased' = 'viewBased',
) {
  // Get all approved instructors
  const instructors = await prisma.instructor_profiles.findMany({
    where: { status: 'APPROVED' },
  });

  if (instructors.length === 0) {
    logger.warn('No approved instructors for subscription share');
    return [];
  }

  const earnings = [];

  if (distributionMethod === 'equal') {
    // Equal distribution among all instructors
    const sharePerInstructor = subscriptionAmount / instructors.length;

    for (const instructor of instructors) {
      const earning = await recordEarning({
        instructorId: instructor.id,
        type: 'SUBSCRIPTION_SHARE',
        sourceType: 'SUBSCRIPTION',
        grossAmount: sharePerInstructor,
        description: 'Monthly subscription share (equal distribution)',
        periodStart,
        periodEnd,
        metadata: { distributionMethod: 'equal', totalInstructors: instructors.length },
      });
      earnings.push(earning);
    }
  } else {
    // View-based distribution
    // Get view counts from analytics in the period
    const analytics = await prisma.instructor_analytics.groupBy({
      by: ['instructorId'],
      where: {
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _sum: {
        views: true,
      },
    });

    const totalViews = analytics.reduce((sum, a) => sum + (a._sum.views || 0), 0);

    if (totalViews === 0) {
      // Fallback to equal distribution if no views
      return calculateSubscriptionShare(subscriptionAmount, periodStart, periodEnd, 'equal');
    }

    for (const analytic of analytics) {
      const instructor = instructors.find((i) => i.id === analytic.instructorId);
      if (!instructor) continue;

      const viewShare = (analytic._sum.views || 0) / totalViews;
      const share = subscriptionAmount * viewShare;

      if (share > 0) {
        const earning = await recordEarning({
          instructorId: instructor.id,
          type: 'SUBSCRIPTION_SHARE',
          sourceType: 'SUBSCRIPTION',
          grossAmount: share,
          description: 'Monthly subscription share (view-based)',
          periodStart,
          periodEnd,
          metadata: {
            distributionMethod: 'viewBased',
            views: analytic._sum.views,
            totalViews,
            viewShare,
          },
        });
        earnings.push(earning);
      }
    }
  }

  logger.info(
    { count: earnings.length, totalAmount: subscriptionAmount },
    'Subscription share distributed',
  );

  return earnings;
}

/**
 * Record a tip for an instructor
 */
export async function recordTip(
  instructorId: string,
  amount: number,
  studentId?: string,
  message?: string,
) {
  return recordEarning({
    instructorId,
    type: 'TIP',
    sourceType: 'TIP',
    grossAmount: amount,
    studentId,
    description: message || 'Tip from student',
    metadata: { message },
  });
}

/**
 * Record a bonus for an instructor
 */
export async function recordBonus(
  instructorId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>,
) {
  // Bonuses don't have platform fee
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  const earning = await prisma.instructor_earnings.create({
    data: {
      instructorId,
      type: 'BONUS',
      sourceType: 'TIP', // Using TIP as bonus source
      grossAmount: amount,
      platformFee: 0,
      netAmount: amount,
      description,
      status: 'PENDING',
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  logger.info({ earningId: earning.id, instructorId, amount }, 'Bonus recorded');

  return earning;
}

// ============================================
// Earning Status Management
// ============================================

/**
 * Confirm pending earnings (make them available for payout)
 */
export async function confirmEarnings(earningIds: string[]) {
  const result = await prisma.instructor_earnings.updateMany({
    where: {
      id: { in: earningIds },
      status: 'PENDING',
    },
    data: {
      status: 'CONFIRMED',
    },
  });

  logger.info({ count: result.count }, 'Earnings confirmed');

  return result;
}

/**
 * Mark earnings as paid
 */
export async function markEarningsAsPaid(earningIds: string[], payoutId: string) {
  const result = await prisma.instructor_earnings.updateMany({
    where: {
      id: { in: earningIds },
      status: 'CONFIRMED',
    },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      payoutId,
    },
  });

  logger.info({ count: result.count, payoutId }, 'Earnings marked as paid');

  return result;
}

/**
 * Cancel earnings
 */
export async function cancelEarnings(earningIds: string[], reason: string) {
  const result = await prisma.instructor_earnings.updateMany({
    where: {
      id: { in: earningIds },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    data: {
      status: 'CANCELLED',
      metadata: { cancelReason: reason } as Prisma.InputJsonValue,
    },
  });

  logger.info({ count: result.count, reason }, 'Earnings cancelled');

  return result;
}

// ============================================
// Earnings Queries
// ============================================

/**
 * Get earnings summary for an instructor
 */
export async function getEarningsSummary(
  instructorId: string,
  period?: { start: Date; end: Date },
): Promise<EarningSummary> {
  const where: Prisma.instructor_earningsWhereInput = {
    instructorId,
  };

  if (period) {
    where.createdAt = {
      gte: period.start,
      lte: period.end,
    };
  }

  // Get all earnings
  const earnings = await prisma.instructor_earnings.findMany({
    where,
  });

  // Calculate summary
  const summary: EarningSummary = {
    totalGross: 0,
    totalPlatformFee: 0,
    totalNet: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    paidAmount: 0,
    earningsByType: {},
  };

  for (const earning of earnings) {
    const gross = Number(earning.grossAmount);
    const platformFee = Number(earning.platformFee);
    const net = Number(earning.netAmount);

    if (earning.status !== 'CANCELLED') {
      summary.totalGross += gross;
      summary.totalPlatformFee += platformFee;
      summary.totalNet += net;
    }

    switch (earning.status) {
      case 'PENDING':
        summary.pendingAmount += net;
        break;
      case 'CONFIRMED':
        summary.confirmedAmount += net;
        break;
      case 'PAID':
        summary.paidAmount += net;
        break;
    }

    // Group by type
    if (earning.status !== 'CANCELLED') {
      summary.earningsByType[earning.type] =
        (summary.earningsByType[earning.type] || 0) + net;
    }
  }

  return summary;
}

/**
 * Get earnings history with pagination
 */
export async function getEarningsHistory(
  instructorId: string,
  filters: EarningFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const where: Prisma.instructor_earningsWhereInput = {
    instructorId,
  };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.sourceType) {
    where.sourceType = filters.sourceType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [items, total] = await Promise.all([
    prisma.instructor_earnings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.instructor_earnings.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get pending (available for payout) earnings
 */
export async function getPendingEarnings(instructorId: string) {
  return prisma.instructor_earnings.findMany({
    where: {
      instructorId,
      status: 'CONFIRMED',
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get total pending amount for instructor
 */
export async function getPendingAmount(instructorId: string): Promise<number> {
  const result = await prisma.instructor_earnings.aggregate({
    where: {
      instructorId,
      status: 'CONFIRMED',
    },
    _sum: {
      netAmount: true,
    },
  });

  return Number(result._sum.netAmount || 0);
}

/**
 * Get earnings grouped by content
 */
export async function getEarningsByContent(
  instructorId: string,
  contentType: 'PROGRAM' | 'CLASS',
) {
  const earnings = await prisma.instructor_earnings.groupBy({
    by: ['sourceId'],
    where: {
      instructorId,
      sourceType: contentType,
      status: { not: 'CANCELLED' },
    },
    _sum: {
      netAmount: true,
      grossAmount: true,
    },
    _count: true,
  });

  // Get content details
  const result = await Promise.all(
    earnings.map(async (e) => {
      let content = null;
      if (e.sourceId) {
        if (contentType === 'PROGRAM') {
          content = await prisma.programs.findUnique({
            where: { id: e.sourceId },
            select: { id: true, title: true },
          });
        } else {
          content = await prisma.classes.findUnique({
            where: { id: e.sourceId },
            select: { id: true, title: true },
          });
        }
      }

      return {
        sourceId: e.sourceId,
        content,
        totalGross: Number(e._sum.grossAmount || 0),
        totalNet: Number(e._sum.netAmount || 0),
        count: e._count,
      };
    }),
  );

  return result.filter((r) => r.content !== null);
}

/**
 * Get top earning content for instructor
 */
export async function getTopEarningContent(instructorId: string, limit: number = 10) {
  const [programs, classes] = await Promise.all([
    getEarningsByContent(instructorId, 'PROGRAM'),
    getEarningsByContent(instructorId, 'CLASS'),
  ]);

  const allContent = [
    ...programs.map((p) => ({ ...p, type: 'PROGRAM' as const })),
    ...classes.map((c) => ({ ...c, type: 'CLASS' as const })),
  ];

  return allContent
    .sort((a, b) => b.totalNet - a.totalNet)
    .slice(0, limit);
}

// ============================================
// Platform Earnings
// ============================================

/**
 * Get total platform earnings (admin)
 */
export async function getPlatformEarnings(period?: { start: Date; end: Date }) {
  const where: Prisma.instructor_earningsWhereInput = {
    status: { not: 'CANCELLED' },
  };

  if (period) {
    where.createdAt = {
      gte: period.start,
      lte: period.end,
    };
  }

  const result = await prisma.instructor_earnings.aggregate({
    where,
    _sum: {
      grossAmount: true,
      platformFee: true,
      netAmount: true,
    },
  });

  // Group by type
  const byType = await prisma.instructor_earnings.groupBy({
    by: ['type'],
    where,
    _sum: {
      platformFee: true,
    },
  });

  return {
    totalGross: Number(result._sum.grossAmount || 0),
    totalPlatformFee: Number(result._sum.platformFee || 0),
    totalInstructorPayout: Number(result._sum.netAmount || 0),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = Number(item._sum.platformFee || 0);
      return acc;
    }, {} as Record<string, number>),
  };
}
