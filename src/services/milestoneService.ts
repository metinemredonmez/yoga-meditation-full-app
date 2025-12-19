import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { MilestoneType } from '@prisma/client';

// ============================================
// Milestone Management
// ============================================

export async function createMilestone(
  userId: string,
  type: MilestoneType,
  value: number,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
) {
  // Check if milestone already exists
  const existing = await prisma.milestones.findFirst({
    where: { userId, type, value },
  });

  if (existing) {
    return existing;
  }

  const milestone = await prisma.milestones.create({
    data: {
      userId,
      type,
      value,
      title,
      description,
      metadata: metadata as any,
    },
  });

  logger.info({ userId, type, value }, 'Milestone created');

  return milestone;
}

export async function getMilestones(
  userId: string,
  filters?: { type?: MilestoneType; celebrated?: boolean },
) {
  const where: any = { userId };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.celebrated !== undefined) {
    where.celebratedAt = filters.celebrated ? { not: null } : null;
  }

  return prisma.milestones.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMilestoneById(id: string) {
  return prisma.milestones.findUnique({
    where: { id },
  });
}

export async function celebrateMilestone(userId: string, milestoneId: string) {
  const milestone = await prisma.milestones.findFirst({
    where: { id: milestoneId, userId },
  });

  if (!milestone) {
    return { success: false, message: 'Milestone not found' };
  }

  if (milestone.celebratedAt) {
    return { success: false, message: 'Already celebrated' };
  }

  await prisma.milestones.update({
    where: { id: milestoneId },
    data: { celebratedAt: new Date() },
  });

  return { success: true, milestone };
}

// ============================================
// Milestone Checking
// ============================================

export async function checkMilestones(userId: string) {
  const newMilestones: any[] = [];

  // Get user stats
  const [videoProgress, challengeEnrollments] =
    await Promise.all([
      prisma.video_progress.findMany({
        where: { userId, completed: true },
      }),
      prisma.challenge_enrollments.findMany({
        where: { userId },
      }),
    ]);

  // Placeholder for user level (user_levels removed)
  const userLevel = { level: 1, longestStreak: 0 };

  // Check class milestones
  const classCount = videoProgress.length;
  const classMilestones = [
    { count: 1, type: 'FIRST_CLASS' as const, title: 'First Class!' },
    { count: 10, type: 'CLASSES_10' as const, title: '10 Classes Completed!' },
    { count: 50, type: 'CLASSES_50' as const, title: '50 Classes Completed!' },
    { count: 100, type: 'CLASSES_100' as const, title: '100 Classes Completed!' },
    { count: 500, type: 'CLASSES_500' as const, title: '500 Classes Completed!' },
  ];

  for (const { count, type, title } of classMilestones) {
    if (classCount >= count) {
      const existing = await prisma.milestones.findFirst({
        where: { userId, type },
      });
      if (!existing) {
        const m = await createMilestone(userId, type, count, title);
        newMilestones.push(m);
      }
    }
  }

  // Check challenge milestones
  const challengeCount = challengeEnrollments.length;
  if (challengeCount >= 1) {
    const existing = await prisma.milestones.findFirst({
      where: { userId, type: 'FIRST_CHALLENGE_COMPLETE' },
    });
    if (!existing) {
      const m = await createMilestone(
        userId,
        'FIRST_CHALLENGE_COMPLETE',
        1,
        'First Challenge Completed!',
      );
      newMilestones.push(m);
    }
  }

  // Check level milestones
  if (userLevel) {
    const levelMilestones = [
      { level: 5, type: 'LEVEL_5' as const },
      { level: 10, type: 'LEVEL_10' as const },
      { level: 25, type: 'LEVEL_25' as const },
      { level: 50, type: 'LEVEL_50' as const },
      { level: 100, type: 'LEVEL_100' as const },
    ];

    for (const { level, type } of levelMilestones) {
      if (userLevel.level >= level) {
        const existing = await prisma.milestones.findFirst({
          where: { userId, type },
        });
        if (!existing) {
          const m = await createMilestone(
            userId,
            type,
            level,
            `Level ${level} Reached!`,
          );
          newMilestones.push(m);
        }
      }
    }

    // Check streak milestones
    const streakMilestones = [
      { days: 7, type: 'STREAK_7_DAYS' as const },
      { days: 30, type: 'STREAK_30_DAYS' as const },
      { days: 100, type: 'STREAK_100_DAYS' as const },
      { days: 365, type: 'STREAK_365_DAYS' as const },
    ];

    for (const { days, type } of streakMilestones) {
      if (userLevel.longestStreak >= days) {
        const existing = await prisma.milestones.findFirst({
          where: { userId, type },
        });
        if (!existing) {
          const m = await createMilestone(
            userId,
            type,
            days,
            `${days} Day Streak!`,
          );
          newMilestones.push(m);
        }
      }
    }
  }

  // Check total hours milestones
  const totalMinutes = videoProgress.reduce((sum: number, vp: any) => sum + (vp.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 3600);

  const hourMilestones = [
    { hours: 10, type: 'TOTAL_HOURS_10' as const },
    { hours: 50, type: 'TOTAL_HOURS_50' as const },
    { hours: 100, type: 'TOTAL_HOURS_100' as const },
    { hours: 500, type: 'TOTAL_HOURS_500' as const },
  ];

  for (const { hours, type } of hourMilestones) {
    if (totalHours >= hours) {
      const existing = await prisma.milestones.findFirst({
        where: { userId, type },
      });
      if (!existing) {
        const m = await createMilestone(
          userId,
          type,
          hours,
          `${hours} Hours of Practice!`,
        );
        newMilestones.push(m);
      }
    }
  }

  // Check anniversary milestones
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (user) {
    const now = new Date();
    const accountAge = now.getTime() - user.createdAt.getTime();
    const yearsOld = accountAge / (365 * 24 * 60 * 60 * 1000);

    if (yearsOld >= 1) {
      const existing = await prisma.milestones.findFirst({
        where: { userId, type: 'ANNIVERSARY_1_YEAR' },
      });
      if (!existing) {
        const m = await createMilestone(
          userId,
          'ANNIVERSARY_1_YEAR',
          1,
          '1 Year Anniversary!',
        );
        newMilestones.push(m);
      }
    }

    if (yearsOld >= 2) {
      const existing = await prisma.milestones.findFirst({
        where: { userId, type: 'ANNIVERSARY_2_YEAR' },
      });
      if (!existing) {
        const m = await createMilestone(
          userId,
          'ANNIVERSARY_2_YEAR',
          2,
          '2 Year Anniversary!',
        );
        newMilestones.push(m);
      }
    }
  }

  return newMilestones;
}

// ============================================
// Upcoming Milestones
// ============================================

export async function getUpcomingMilestones(userId: string) {
  const videoProgress = await prisma.video_progress.count({
    where: { userId, completed: true }
  });

  // Placeholder for user level (user_levels removed)
  const userLevel = { level: 1, currentStreak: 0 };

  const upcoming: {
    type: string;
    title: string;
    currentValue: number;
    targetValue: number;
    progress: number;
  }[] = [];

  // Class milestones
  const classTargets = [10, 50, 100, 500];
  const nextClassTarget = classTargets.find((t) => t > videoProgress);
  if (nextClassTarget) {
    upcoming.push({
      type: 'CLASSES',
      title: `Complete ${nextClassTarget} Classes`,
      currentValue: videoProgress,
      targetValue: nextClassTarget,
      progress: (videoProgress / nextClassTarget) * 100,
    });
  }

  // Level milestones
  if (userLevel) {
    const levelTargets = [5, 10, 25, 50, 100];
    const nextLevelTarget = levelTargets.find((t) => t > userLevel.level);
    if (nextLevelTarget) {
      upcoming.push({
        type: 'LEVEL',
        title: `Reach Level ${nextLevelTarget}`,
        currentValue: userLevel.level,
        targetValue: nextLevelTarget,
        progress: (userLevel.level / nextLevelTarget) * 100,
      });
    }

    // Streak milestones
    const streakTargets = [7, 30, 100, 365];
    const nextStreakTarget = streakTargets.find(
      (t) => t > userLevel.currentStreak,
    );
    if (nextStreakTarget) {
      upcoming.push({
        type: 'STREAK',
        title: `${nextStreakTarget} Day Streak`,
        currentValue: userLevel.currentStreak,
        targetValue: nextStreakTarget,
        progress: (userLevel.currentStreak / nextStreakTarget) * 100,
      });
    }
  }

  return upcoming.sort((a, b) => b.progress - a.progress);
}

// ============================================
// Milestone Stats
// ============================================

export async function getMilestoneStats(userId: string) {
  const [total, celebrated, byType] = await Promise.all([
    prisma.milestones.count({ where: { userId } }),
    prisma.milestones.count({
      where: { userId, celebratedAt: { not: null } },
    }),
    prisma.milestones.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    celebrated,
    uncelebrated: total - celebrated,
    byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
  };
}
