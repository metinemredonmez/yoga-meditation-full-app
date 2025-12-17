import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import {
  AchievementCategory,
  AchievementDifficulty,
  AchievementRequirementType,
} from '@prisma/client';
import * as xpService from './xpService';

// ============================================
// Achievement Queries
// ============================================

export async function getAchievements(filters: {
  category?: AchievementCategory;
  difficulty?: AchievementDifficulty;
  isActive?: boolean;
  includeSecret?: boolean;
}) {
  const where: any = {
    isActive: filters.isActive ?? true,
  };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (!filters.includeSecret) {
    where.isSecret = false;
  }

  const achievements = await prisma.achievement.findMany({
    where,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    include: {
      badge: true,
      tier: true,
    },
  });

  return achievements;
}

export async function getAchievementById(id: string) {
  return prisma.achievement.findUnique({
    where: { id },
    include: {
      badge: true,
      tier: true,
      prerequisite: true,
      nextAchievements: true,
    },
  });
}

export async function getAchievementBySlug(slug: string) {
  return prisma.achievement.findUnique({
    where: { slug },
    include: {
      badge: true,
      tier: true,
    },
  });
}

export async function getAchievementCategories() {
  const categories = await prisma.achievement.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { isActive: true },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.id,
  }));
}

// ============================================
// User Achievement Progress
// ============================================

export async function getUserAchievements(userId: string, filters?: {
  category?: AchievementCategory;
  isCompleted?: boolean;
}) {
  const where: any = { userId };

  if (filters?.isCompleted !== undefined) {
    where.isCompleted = filters.isCompleted;
  }

  if (filters?.category) {
    where.achievement = { category: filters.category };
  }

  const userAchievements = await prisma.userAchievement.findMany({
    where,
    include: {
      achievement: {
        include: {
          badge: true,
          tier: true,
        },
      },
    },
    orderBy: [
      { isCompleted: 'desc' },
      { percentage: 'desc' },
    ],
  });

  return userAchievements;
}

export async function getUserAchievementProgress(
  userId: string,
  achievementId: string,
) {
  let progress = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId },
    },
    include: {
      achievement: true,
    },
  });

  if (!progress) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (achievement) {
      progress = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          targetValue: achievement.requirementValue,
        },
        include: {
          achievement: true,
        },
      });
    }
  }

  return progress;
}

// ============================================
// Achievement Progress Update
// ============================================

export async function updateAchievementProgress(
  userId: string,
  type: AchievementRequirementType,
  value: number,
  metadata?: Record<string, unknown>,
) {
  // Find achievements matching this requirement type
  const achievements = await prisma.achievement.findMany({
    where: {
      requirementType: type,
      isActive: true,
    },
  });

  const results: {
    achievementId: string;
    previousValue: number;
    newValue: number;
    isCompleted: boolean;
    isNewlyCompleted: boolean;
  }[] = [];

  for (const achievement of achievements) {
    // Check prerequisites
    if (achievement.prerequisiteId) {
      const prereqProgress = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.prerequisiteId,
          },
        },
      });

      if (!prereqProgress?.isCompleted) {
        continue; // Skip if prerequisite not met
      }
    }

    // Get or create progress
    let progress = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
    });

    const wasCompleted = progress?.isCompleted ?? false;

    if (!progress) {
      progress = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          currentValue: value,
          targetValue: achievement.requirementValue,
          percentage: Math.min((value / achievement.requirementValue) * 100, 100),
          isCompleted: value >= achievement.requirementValue,
          completedAt: value >= achievement.requirementValue ? new Date() : null,
        },
      });
    } else if (!progress.isCompleted) {
      const newValue = progress.currentValue + value;
      const isCompleted = newValue >= achievement.requirementValue;

      progress = await prisma.userAchievement.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          percentage: Math.min(
            (newValue / achievement.requirementValue) * 100,
            100,
          ),
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    const isNewlyCompleted = progress.isCompleted && !wasCompleted;

    if (isNewlyCompleted) {
      await onAchievementCompleted(userId, achievement.id);
    }

    results.push({
      achievementId: achievement.id,
      previousValue: wasCompleted ? progress.currentValue : progress.currentValue - value,
      newValue: progress.currentValue,
      isCompleted: progress.isCompleted,
      isNewlyCompleted,
    });
  }

  return results;
}

export async function setAchievementProgress(
  userId: string,
  achievementId: string,
  currentValue: number,
) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });

  if (!achievement) {
    throw new Error('Achievement not found');
  }

  let progress = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId },
    },
  });

  const wasCompleted = progress?.isCompleted ?? false;
  const isCompleted = currentValue >= achievement.requirementValue;

  if (!progress) {
    progress = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        currentValue,
        targetValue: achievement.requirementValue,
        percentage: Math.min(
          (currentValue / achievement.requirementValue) * 100,
          100,
        ),
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  } else {
    progress = await prisma.userAchievement.update({
      where: { id: progress.id },
      data: {
        currentValue,
        percentage: Math.min(
          (currentValue / achievement.requirementValue) * 100,
          100,
        ),
        isCompleted,
        completedAt: isCompleted && !wasCompleted ? new Date() : progress.completedAt,
      },
    });
  }

  if (isCompleted && !wasCompleted) {
    await onAchievementCompleted(userId, achievementId);
  }

  return progress;
}

// ============================================
// Achievement Completion
// ============================================

async function onAchievementCompleted(userId: string, achievementId: string) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
    include: { badge: true, tier: true },
  });

  if (!achievement) return;

  // Award XP
  if (achievement.xpReward > 0) {
    const multiplier = achievement.tier?.multiplier || 1;
    const xp = Math.floor(achievement.xpReward * multiplier);

    await xpService.awardXP(
      userId,
      xp,
      'ACHIEVEMENT_UNLOCK',
      achievementId,
      `Achievement unlocked: ${achievement.name}`,
      'ACHIEVEMENT_BONUS',
    );
  }

  // Award badge if applicable
  if (achievement.badgeId) {
    await prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId, badgeId: achievement.badgeId },
      },
      create: {
        userId,
        badgeId: achievement.badgeId,
      },
      update: {},
    });
  }

  logger.info(
    { userId, achievementId, achievement: achievement.name },
    'Achievement completed',
  );
}

export async function claimAchievementReward(
  userId: string,
  achievementId: string,
) {
  const progress = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: { userId, achievementId },
    },
    include: { achievement: true },
  });

  if (!progress) {
    return { success: false, message: 'Achievement progress not found' };
  }

  if (!progress.isCompleted) {
    return { success: false, message: 'Achievement not completed' };
  }

  if (progress.claimedAt) {
    return { success: false, message: 'Reward already claimed' };
  }

  await prisma.userAchievement.update({
    where: { id: progress.id },
    data: { claimedAt: new Date() },
  });

  return {
    success: true,
    achievement: progress.achievement,
    xpAwarded: progress.achievement.xpReward,
  };
}

// ============================================
// Secret Achievements
// ============================================

export async function getSecretAchievements(userId: string) {
  // Get user's completed secret achievements
  const completedSecrets = await prisma.userAchievement.findMany({
    where: {
      userId,
      isCompleted: true,
      achievement: { isSecret: true },
    },
    include: { achievement: true },
  });

  // Get total secret achievement count
  const totalSecrets = await prisma.achievement.count({
    where: { isSecret: true, isActive: true },
  });

  return {
    unlockedCount: completedSecrets.length,
    totalCount: totalSecrets,
    achievements: completedSecrets.map((p) => p.achievement),
  };
}

// ============================================
// Achievement Stats
// ============================================

export async function getUserAchievementStats(userId: string) {
  const [total, completed, categories] = await Promise.all([
    prisma.achievement.count({ where: { isActive: true, isSecret: false } }),
    prisma.userAchievement.count({
      where: { userId, isCompleted: true },
    }),
    prisma.userAchievement.groupBy({
      by: ['achievementId'],
      where: { userId, isCompleted: true },
    }),
  ]);

  // Get XP from achievements
  const completedAchievements = await prisma.userAchievement.findMany({
    where: { userId, isCompleted: true },
    include: { achievement: true },
  });

  const totalXPFromAchievements = completedAchievements.reduce(
    (sum, ua) => sum + (ua.achievement.xpReward || 0),
    0,
  );

  // Get category breakdown
  const categoryStats = await prisma.$queryRaw<
    { category: string; completed: number; total: number }[]
  >`
    SELECT
      a.category,
      COUNT(CASE WHEN ua."isCompleted" = true THEN 1 END)::int as completed,
      COUNT(*)::int as total
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua."achievementId" = a.id AND ua."userId" = ${userId}
    WHERE a."isActive" = true AND a."isSecret" = false
    GROUP BY a.category
  `;

  return {
    totalAchievements: total,
    completedAchievements: completed,
    completionPercentage: total > 0 ? (completed / total) * 100 : 0,
    totalXPEarned: totalXPFromAchievements,
    categoryBreakdown: categoryStats,
  };
}

// ============================================
// Admin Functions
// ============================================

export async function createAchievement(data: {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  icon: string;
  iconLocked?: string;
  color?: string;
  animation?: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  requirementType: AchievementRequirementType;
  requirementValue: number;
  requirementMeta?: any;
  xpReward?: number;
  badgeId?: string;
  rewardType?: string;
  rewardValue?: string;
  isSecret?: boolean;
  sortOrder?: number;
  tierId?: string;
  prerequisiteId?: string;
}) {
  return prisma.achievement.create({
    data: {
      ...data,
      rewardType: data.rewardType as any,
    },
  });
}

export async function updateAchievement(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    longDescription: string;
    icon: string;
    iconLocked: string;
    color: string;
    animation: string;
    category: AchievementCategory;
    difficulty: AchievementDifficulty;
    requirementType: AchievementRequirementType;
    requirementValue: number;
    requirementMeta: any;
    xpReward: number;
    badgeId: string;
    rewardType: string;
    rewardValue: string;
    isSecret: boolean;
    isActive: boolean;
    sortOrder: number;
    tierId: string;
    prerequisiteId: string;
  }>,
) {
  return prisma.achievement.update({
    where: { id },
    data: {
      ...data,
      rewardType: data.rewardType as any,
    },
  });
}

export async function deleteAchievement(id: string) {
  return prisma.achievement.delete({
    where: { id },
  });
}
