import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { QuestType, QuestResetPeriod, QuestRequirementType } from '@prisma/client';
import * as xpService from './xpService';

// ============================================
// Quest Queries
// ============================================

export async function getActiveQuests(type?: QuestType) {
  const now = new Date();

  const where: any = {
    isActive: true,
    OR: [
      { startDate: null, endDate: null },
      {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
    ],
  };

  if (type) {
    where.type = type;
  }

  return prisma.quest.findMany({
    where,
    orderBy: [{ type: 'asc' }, { xpReward: 'desc' }],
  });
}

export async function getQuestById(id: string) {
  return prisma.quest.findUnique({
    where: { id },
  });
}

// ============================================
// User Quest Management
// ============================================

export async function getUserQuests(
  userId: string,
  type?: QuestType,
) {
  const now = new Date();
  const { periodStart, periodEnd } = getCurrentPeriod(type || 'DAILY');

  // Get active quests
  const activeQuests = await getActiveQuests(type);

  // Get or create user quest progress for each active quest
  const userQuests = await Promise.all(
    activeQuests.map(async (quest) => {
      const { periodStart: qStart, periodEnd: qEnd } = getCurrentPeriod(quest.resetPeriod);

      let progress = await prisma.userQuest.findUnique({
        where: {
          userId_questId_periodStart: {
            userId,
            questId: quest.id,
            periodStart: qStart,
          },
        },
      });

      if (!progress) {
        progress = await prisma.userQuest.create({
          data: {
            userId,
            questId: quest.id,
            periodStart: qStart,
            periodEnd: qEnd,
            targetValue: quest.requirementValue,
          },
        });
      }

      return {
        ...progress,
        quest,
      };
    }),
  );

  return userQuests;
}

export async function getDailyQuests(userId: string) {
  return getUserQuests(userId, 'DAILY');
}

export async function getWeeklyQuests(userId: string) {
  return getUserQuests(userId, 'WEEKLY');
}

export async function getMonthlyQuests(userId: string) {
  return getUserQuests(userId, 'MONTHLY');
}

// ============================================
// Quest Progress
// ============================================

export async function updateQuestProgress(
  userId: string,
  type: QuestRequirementType,
  value: number,
  metadata?: Record<string, unknown>,
) {
  // Find quests matching this requirement type
  const activeQuests = await prisma.quest.findMany({
    where: {
      requirementType: type,
      isActive: true,
    },
  });

  const results: {
    questId: string;
    questName: string;
    previousValue: number;
    newValue: number;
    isCompleted: boolean;
    isNewlyCompleted: boolean;
  }[] = [];

  for (const quest of activeQuests) {
    const { periodStart, periodEnd } = getCurrentPeriod(quest.resetPeriod);

    // Get or create progress
    let progress = await prisma.userQuest.findUnique({
      where: {
        userId_questId_periodStart: { userId, questId: quest.id, periodStart },
      },
    });

    if (!progress) {
      progress = await prisma.userQuest.create({
        data: {
          userId,
          questId: quest.id,
          periodStart,
          periodEnd,
          currentValue: value,
          targetValue: quest.requirementValue,
          isCompleted: value >= quest.requirementValue,
          completedAt: value >= quest.requirementValue ? new Date() : null,
        },
      });
    } else if (!progress.isCompleted) {
      const newValue = progress.currentValue + value;
      const isCompleted = newValue >= quest.requirementValue;

      progress = await prisma.userQuest.update({
        where: { id: progress.id },
        data: {
          currentValue: newValue,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    const wasCompleted = progress.isCompleted && progress.completedAt !== null;
    const isNewlyCompleted =
      progress.isCompleted && !results.find((r) => r.questId === quest.id);

    results.push({
      questId: quest.id,
      questName: quest.name,
      previousValue: progress.currentValue - value,
      newValue: progress.currentValue,
      isCompleted: progress.isCompleted,
      isNewlyCompleted,
    });
  }

  return results;
}

// ============================================
// Quest Rewards
// ============================================

export async function claimQuestReward(userId: string, questId: string) {
  const { periodStart } = await getCurrentPeriodForQuest(questId);

  const progress = await prisma.userQuest.findUnique({
    where: {
      userId_questId_periodStart: { userId, questId, periodStart },
    },
    include: { quest: true },
  });

  if (!progress) {
    return { success: false, message: 'Quest progress not found' };
  }

  if (!progress.isCompleted) {
    return { success: false, message: 'Quest not completed' };
  }

  if (progress.isClaimed) {
    return { success: false, message: 'Reward already claimed' };
  }

  // Award XP
  const xpResult = await xpService.awardXP(
    userId,
    progress.quest.xpReward,
    'CLASS_COMPLETE', // Using generic source
    questId,
    `Quest completed: ${progress.quest.name}`,
    'EARN',
  );

  // Mark as claimed
  await prisma.userQuest.update({
    where: { id: progress.id },
    data: {
      isClaimed: true,
      claimedAt: new Date(),
    },
  });

  // Handle bonus rewards
  let bonusReward = null;
  if (progress.quest.bonusReward) {
    bonusReward = progress.quest.bonusReward;
    // Process bonus rewards (badges, items, etc.)
  }

  logger.info({ userId, questId }, 'Quest reward claimed');

  return {
    success: true,
    xpAwarded: progress.quest.xpReward,
    bonusReward,
    xpResult,
  };
}

// ============================================
// Quest Reset (Cron Jobs)
// ============================================

export async function resetDailyQuests() {
  const { periodStart } = getCurrentPeriod('DAILY');
  const yesterday = new Date(periodStart);
  yesterday.setDate(yesterday.getDate() - 1);

  // Mark unclaimed quests as expired
  const result = await prisma.userQuest.updateMany({
    where: {
      periodStart: yesterday,
      isClaimed: false,
      quest: { resetPeriod: 'DAILY' },
    },
    data: {
      // No actual update needed, just for tracking
    },
  });

  logger.info({ date: periodStart }, 'Daily quests reset');
  return result;
}

export async function resetWeeklyQuests() {
  const { periodStart } = getCurrentPeriod('WEEKLY');
  logger.info({ date: periodStart }, 'Weekly quests reset');
}

export async function resetMonthlyQuests() {
  const { periodStart } = getCurrentPeriod('MONTHLY');
  logger.info({ date: periodStart }, 'Monthly quests reset');
}

// ============================================
// Helper Functions
// ============================================

function getCurrentPeriod(resetPeriod: QuestResetPeriod | QuestType): {
  periodStart: Date;
  periodEnd: Date;
} {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (resetPeriod) {
    case 'DAILY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;

    case 'WEEKLY':
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      periodStart = monday;
      periodEnd = new Date(monday);
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;

    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;

    default:
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(2099, 11, 31); // Far future
  }

  return { periodStart, periodEnd };
}

async function getCurrentPeriodForQuest(questId: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    select: { resetPeriod: true },
  });

  return getCurrentPeriod(quest?.resetPeriod || 'DAILY');
}

// ============================================
// Quest Stats
// ============================================

export async function getUserQuestStats(userId: string) {
  const now = new Date();
  const { periodStart: dailyStart } = getCurrentPeriod('DAILY');
  const { periodStart: weeklyStart } = getCurrentPeriod('WEEKLY');
  const { periodStart: monthlyStart } = getCurrentPeriod('MONTHLY');

  const [dailyCompleted, weeklyCompleted, monthlyCompleted, totalCompleted] =
    await Promise.all([
      prisma.userQuest.count({
        where: { userId, periodStart: dailyStart, isCompleted: true },
      }),
      prisma.userQuest.count({
        where: { userId, periodStart: weeklyStart, isCompleted: true },
      }),
      prisma.userQuest.count({
        where: { userId, periodStart: monthlyStart, isCompleted: true },
      }),
      prisma.userQuest.count({
        where: { userId, isCompleted: true },
      }),
    ]);

  return {
    daily: { completed: dailyCompleted },
    weekly: { completed: weeklyCompleted },
    monthly: { completed: monthlyCompleted },
    allTime: { completed: totalCompleted },
  };
}

// ============================================
// Admin Functions
// ============================================

export async function createQuest(data: {
  name: string;
  description: string;
  icon: string;
  color?: string;
  type: QuestType;
  resetPeriod: QuestResetPeriod;
  requirementType: QuestRequirementType;
  requirementValue: number;
  requirementMeta?: any;
  xpReward: number;
  bonusReward?: any;
  startDate?: Date;
  endDate?: Date;
}) {
  return prisma.quest.create({ data });
}

export async function updateQuest(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    type: QuestType;
    resetPeriod: QuestResetPeriod;
    requirementType: QuestRequirementType;
    requirementValue: number;
    requirementMeta: any;
    xpReward: number;
    bonusReward: any;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
  }>,
) {
  return prisma.quest.update({
    where: { id },
    data,
  });
}

export async function deleteQuest(id: string) {
  return prisma.quest.delete({ where: { id } });
}
