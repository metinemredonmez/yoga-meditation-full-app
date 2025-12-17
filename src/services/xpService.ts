import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { XPSource, XPTransactionType, SubscriptionTier } from '@prisma/client';

// XP Configuration
const XP_CONFIG: Record<XPSource, number> = {
  CLASS_COMPLETE: 50,
  PROGRAM_COMPLETE: 500,
  CHALLENGE_COMPLETE: 300,
  CHALLENGE_MILESTONE: 100,
  DAILY_LOGIN: 10,
  STREAK_MILESTONE: 100,
  ACHIEVEMENT_UNLOCK: 50,
  BADGE_EARN: 25,
  FORUM_POST: 15,
  FORUM_REPLY: 10,
  HELPFUL_ANSWER: 25,
  REFERRAL: 200,
  PROFILE_COMPLETE: 50,
  FIRST_CLASS: 100,
  FIRST_PROGRAM: 200,
  REVIEW_SUBMIT: 20,
  SOCIAL_SHARE: 5,
  LIVE_SESSION_ATTEND: 75,
  LIVE_SESSION_HOST: 150,
  ADMIN: 0,
};

// Level calculation: Level = floor(sqrt(totalXP / 100))
// Inverse: XP needed for level = level^2 * 100
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

export function getXPForNextLevel(level: number): number {
  return Math.pow(level, 2) * 100;
}

// ============================================
// User Level Management
// ============================================

export async function getOrCreateUserLevel(userId: string) {
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId },
  });

  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId },
    });
  }

  return userLevel;
}

export async function getUserStats(userId: string) {
  const userLevel = await getOrCreateUserLevel(userId);
  const currentLevelXP = getXPForLevel(userLevel.level);
  const nextLevelXP = getXPForNextLevel(userLevel.level);
  const xpInCurrentLevel = userLevel.totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;

  return {
    userId,
    level: userLevel.level,
    currentXP: userLevel.currentXP,
    totalXP: userLevel.totalXP,
    xpInCurrentLevel,
    xpNeededForNextLevel: xpNeededForNext - xpInCurrentLevel,
    progressPercent: Math.min(progressPercent, 100),
    currentStreak: userLevel.currentStreak,
    longestStreak: userLevel.longestStreak,
    lastActivityDate: userLevel.lastActivityDate,
  };
}

export async function getLevelInfo(userId: string) {
  const userLevel = await getOrCreateUserLevel(userId);
  const level = userLevel.level;

  return {
    currentLevel: level,
    totalXP: userLevel.totalXP,
    xpForCurrentLevel: getXPForLevel(level),
    xpForNextLevel: getXPForNextLevel(level),
    levelUpAt: userLevel.levelUpAt,
    previousLevel: userLevel.previousLevel,
  };
}

// ============================================
// XP Operations
// ============================================

export async function awardXP(
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string,
  description?: string,
  type: XPTransactionType = 'EARN',
  metadata?: Record<string, unknown>,
) {
  const userLevel = await getOrCreateUserLevel(userId);

  // Apply multiplier
  const multiplier = await getXPMultiplier(userId);
  const finalAmount = Math.floor(amount * multiplier);

  const balanceBefore = userLevel.totalXP;
  const balanceAfter = balanceBefore + finalAmount;
  const newLevel = calculateLevel(balanceAfter);
  const didLevelUp = newLevel > userLevel.level;

  // Create transaction and update user level
  const [transaction] = await prisma.$transaction([
    prisma.xPTransaction.create({
      data: {
        userId,
        amount: finalAmount,
        type,
        source,
        sourceId,
        description,
        balanceBefore,
        balanceAfter,
        metadata: metadata as any,
      },
    }),
    prisma.userLevel.update({
      where: { userId },
      data: {
        currentXP: { increment: finalAmount },
        totalXP: balanceAfter,
        level: newLevel,
        ...(didLevelUp && {
          levelUpAt: new Date(),
          previousLevel: userLevel.level,
        }),
      },
    }),
  ]);

  logger.info(
    { userId, amount: finalAmount, source, newLevel, didLevelUp },
    'XP awarded',
  );

  return {
    transaction,
    xpAwarded: finalAmount,
    newTotalXP: balanceAfter,
    previousLevel: userLevel.level,
    newLevel,
    didLevelUp,
    multiplier,
  };
}

export async function deductXP(
  userId: string,
  amount: number,
  description?: string,
) {
  const userLevel = await getOrCreateUserLevel(userId);

  const balanceBefore = userLevel.totalXP;
  const balanceAfter = Math.max(0, balanceBefore - amount);
  const actualDeduction = balanceBefore - balanceAfter;
  const newLevel = calculateLevel(balanceAfter);

  const [transaction] = await prisma.$transaction([
    prisma.xPTransaction.create({
      data: {
        userId,
        amount: -actualDeduction,
        type: 'ADMIN_ADJUSTMENT',
        source: 'ADMIN',
        description,
        balanceBefore,
        balanceAfter,
      },
    }),
    prisma.userLevel.update({
      where: { userId },
      data: {
        currentXP: Math.max(0, userLevel.currentXP - actualDeduction),
        totalXP: balanceAfter,
        level: newLevel,
      },
    }),
  ]);

  return { transaction, deducted: actualDeduction, newTotalXP: balanceAfter };
}

// ============================================
// XP Multiplier
// ============================================

export async function getXPMultiplier(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const userLevel = await getOrCreateUserLevel(userId);

  let multiplier = 1.0;

  // Premium tier bonus
  if (user?.subscriptionTier === 'PREMIUM') {
    multiplier += 0.25; // 25% bonus for premium
  } else if (user?.subscriptionTier === 'BASIC') {
    multiplier += 0.1; // 10% bonus for basic
  }

  // Streak bonus (up to 50% at 30+ day streak)
  const streakBonus = Math.min(userLevel.currentStreak / 60, 0.5);
  multiplier += streakBonus;

  return multiplier;
}

// ============================================
// XP History
// ============================================

export async function getXPHistory(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
  filters: { source?: XPSource; type?: XPTransactionType; startDate?: Date; endDate?: Date } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (filters.source) {
    where.source = filters.source;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.xPTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.xPTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// XP Leaderboard
// ============================================

export async function getXPLeaderboard(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.userLevel.findMany({
      orderBy: { totalXP: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            equippedTitleId: true,
            equippedFrameId: true,
          },
        },
      },
    }),
    prisma.userLevel.count(),
  ]);

  const leaderboard = entries.map((entry, index) => ({
    rank: skip + index + 1,
    userId: entry.userId,
    userName: `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'Yogi',
    level: entry.level,
    totalXP: entry.totalXP,
    currentStreak: entry.currentStreak,
  }));

  return {
    leaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Helper Functions
// ============================================

export function getDefaultXPAmount(source: XPSource): number {
  return XP_CONFIG[source] || 0;
}

export async function getUserRank(userId: string): Promise<number | null> {
  const userLevel = await prisma.userLevel.findUnique({
    where: { userId },
  });

  if (!userLevel) return null;

  const rank = await prisma.userLevel.count({
    where: {
      totalXP: { gt: userLevel.totalXP },
    },
  });

  return rank + 1;
}
