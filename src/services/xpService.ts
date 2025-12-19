import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { XPSource } from '@prisma/client';

// ============================================
// User Level Management
// ============================================

/**
 * Get default XP amount for different actions
 */
export function getDefaultXPAmount(actionType: string): number {
  const xpAmounts: Record<string, number> = {
    CLASS_COMPLETE: 50,
    PROGRAM_COMPLETE: 200,
    CHALLENGE_COMPLETE: 150,
    CHALLENGE_MILESTONE: 25,
    FORUM_POST: 10,
    FORUM_REPLY: 5,
    HELPFUL_ANSWER: 20,
    LIVE_SESSION_ATTEND: 75,
    LIVE_SESSION_HOST: 100,
    REVIEW_SUBMIT: 15,
    DAILY_LOGIN: 5,
    SOCIAL_SHARE: 10,
    PROFILE_COMPLETE: 50,
    FIRST_CLASS: 100,
    FIRST_PROGRAM: 250,
    BADGE_EARN: 50,
  };

  return xpAmounts[actionType] || 10; // Default 10 XP if not specified
}

export async function getOrCreateUserLevel(userId: string) {
  let userLevel = await prisma.user_levels.findUnique({
    where: { userId },
  });

  if (!userLevel) {
    userLevel = await prisma.user_levels.create({
      data: {
        userId,
        currentXP: 0,
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  }

  return userLevel;
}

export async function getUserLevel(userId: string) {
  return prisma.user_levels.findUnique({
    where: { userId },
  });
}

export async function addXP(
  userId: string,
  amount: number,
  source: XPSource,
  description: string
) {
  const userLevel = await getOrCreateUserLevel(userId);

  const newCurrentXP = userLevel.currentXP + amount;
  const newTotalXP = userLevel.totalXP + amount;

  // Calculate new level (simple formula: every 1000 XP = 1 level)
  const newLevel = Math.floor(newTotalXP / 1000) + 1;
  const leveledUp = newLevel > userLevel.level;

  const updatedLevel = await prisma.user_levels.update({
    where: { userId },
    data: {
      currentXP: newCurrentXP,
      totalXP: newTotalXP,
      level: newLevel,
      ...(leveledUp && {
        levelUpAt: new Date(),
        previousLevel: userLevel.level,
      }),
    },
  });

  // Log the XP transaction
  await prisma.xp_transactions.create({
    data: {
      userId,
      amount,
      type: 'EARN',
      source,
      description,
      balanceBefore: userLevel.currentXP,
      balanceAfter: newCurrentXP,
    },
  });

  logger.info({ userId, amount, source, description, newLevel, leveledUp }, 'XP added');

  return {
    userLevel: updatedLevel,
    leveledUp,
    previousLevel: userLevel.level,
    newLevel,
  };
}

export async function deductXP(userId: string, amount: number, reason: string) {
  const userLevel = await getOrCreateUserLevel(userId);

  if (userLevel.currentXP < amount) {
    throw new Error('Insufficient XP');
  }

  const newCurrentXP = userLevel.currentXP - amount;

  const updatedLevel = await prisma.user_levels.update({
    where: { userId },
    data: {
      currentXP: newCurrentXP,
    },
  });

  // Log the XP transaction
  await prisma.xp_transactions.create({
    data: {
      userId,
      amount: -amount,
      type: 'ADMIN_ADJUSTMENT',
      source: 'DAILY_LOGIN',
      description: reason,
      balanceBefore: userLevel.currentXP,
      balanceAfter: newCurrentXP,
    },
  });

  logger.info({ userId, amount, reason }, 'XP deducted');

  return updatedLevel;
}

export async function getXPTransactions(
  userId: string,
  pagination: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.xp_transactions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.xp_transactions.count({ where: { userId } }),
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

export async function getLeaderboard(limit: number = 50) {
  return prisma.user_levels.findMany({
    take: limit,
    orderBy: [
      { level: 'desc' },
      { totalXP: 'desc' },
    ],
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// ============================================
// Additional XP Functions
// ============================================

/**
 * Get user stats including level, XP, and streaks
 */
export async function getUserStats(userId: string) {
  const userLevel = await getUserLevel(userId);

  if (!userLevel) {
    return null;
  }

  // Calculate XP needed for next level (1000 XP per level)
  const xpForNextLevel = userLevel.level * 1000;
  const xpNeeded = xpForNextLevel - userLevel.totalXP;

  return {
    userId: userLevel.userId,
    currentXP: userLevel.currentXP,
    totalXP: userLevel.totalXP,
    level: userLevel.level,
    previousLevel: userLevel.previousLevel,
    levelUpAt: userLevel.levelUpAt,
    xpForNextLevel,
    xpNeeded,
    currentStreak: userLevel.currentStreak,
    longestStreak: userLevel.longestStreak,
    lastActivityDate: userLevel.lastActivityDate,
  };
}

/**
 * Get level information including thresholds
 */
export async function getLevelInfo(level: number) {
  const xpRequired = (level - 1) * 1000;
  const xpForNext = level * 1000;
  const xpNeeded = xpForNext - xpRequired;

  return {
    level,
    xpRequired,
    xpForNext,
    xpNeeded,
    title: getLevelTitle(level),
  };
}

/**
 * Get XP transaction history for a user
 */
export async function getXPHistory(
  userId: string,
  options: { page?: number; limit?: number; type?: string; source?: string } = {}
) {
  const { page = 1, limit = 20, type, source } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (type) where.type = type;
  if (source) where.source = source;

  const [transactions, total] = await Promise.all([
    prisma.xp_transactions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.xp_transactions.count({ where }),
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

/**
 * Get XP leaderboard with pagination
 */
export async function getXPLeaderboard(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [leaderboard, total] = await Promise.all([
    prisma.user_levels.findMany({
      skip,
      take: limit,
      orderBy: [
        { level: 'desc' },
        { totalXP: 'desc' },
      ],
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.user_levels.count(),
  ]);

  // Add rank to each entry
  const rankedLeaderboard = leaderboard.map((entry, index) => ({
    ...entry,
    rank: skip + index + 1,
  }));

  return {
    leaderboard: rankedLeaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user's rank on the leaderboard
 */
export async function getUserRank(userId: string) {
  const userLevel = await getUserLevel(userId);

  if (!userLevel) {
    return null;
  }

  // Count how many users have higher level or same level with more XP
  const rank = await prisma.user_levels.count({
    where: {
      OR: [
        { level: { gt: userLevel.level } },
        {
          AND: [
            { level: userLevel.level },
            { totalXP: { gt: userLevel.totalXP } },
          ],
        },
      ],
    },
  });

  return {
    userId,
    rank: rank + 1, // +1 because count returns users above them
    level: userLevel.level,
    totalXP: userLevel.totalXP,
  };
}

// Helper function to get level title
function getLevelTitle(level: number): string {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Novice';
  if (level < 20) return 'Intermediate';
  if (level < 35) return 'Advanced';
  if (level < 50) return 'Expert';
  if (level < 75) return 'Master';
  return 'Grand Master';
}
