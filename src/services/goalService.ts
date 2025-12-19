import { prisma } from '../utils/database';
import type { GoalType, GoalPeriod } from '@prisma/client';
import type {
  CreateGoalInput,
  UpdateGoalInput,
  GoalFilters,
  AddProgressInput,
  ProgressFilters,
} from '../validation/goalSchemas';

// ==================== GOALS ====================

export async function getGoals(userId: string, filters: GoalFilters) {
  const { type, period, isActive, isCompleted, page, limit } = filters;

  const where: any = { userId };
  if (type) where.type = type;
  if (period) where.period = period;
  if (isActive !== undefined) where.isActive = isActive;
  if (isCompleted !== undefined) where.isCompleted = isCompleted;

  const [goals, total] = await Promise.all([
    prisma.user_goals.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        progress: {
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    }),
    prisma.user_goals.count({ where }),
  ]);

  return {
    goals,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getGoal(userId: string, id: string) {
  return prisma.user_goals.findFirst({
    where: { id, userId },
    include: {
      progress: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  return prisma.user_goals.create({
    data: {
      userId,
      type: input.type as GoalType,
      title: input.title,
      description: input.description,
      targetValue: input.targetValue,
      unit: input.unit,
      period: input.period as GoalPeriod,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.endDate ? new Date(input.endDate) : null,
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime,
    },
    include: {
      progress: true,
    },
  });
}

export async function updateGoal(userId: string, id: string, input: UpdateGoalInput) {
  const existing = await prisma.user_goals.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Goal not found');
  }

  return prisma.user_goals.update({
    where: { id },
    data: {
      ...input,
      period: input.period as GoalPeriod | undefined,
      endDate: input.endDate ? new Date(input.endDate) : input.endDate === null ? null : undefined,
    },
    include: {
      progress: {
        orderBy: { date: 'desc' },
        take: 7,
      },
    },
  });
}

export async function deleteGoal(userId: string, id: string) {
  const existing = await prisma.user_goals.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Goal not found');
  }

  return prisma.user_goals.delete({
    where: { id },
  });
}

export async function toggleGoal(userId: string, id: string) {
  const existing = await prisma.user_goals.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Goal not found');
  }

  return prisma.user_goals.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}

export async function completeGoal(userId: string, id: string) {
  const existing = await prisma.user_goals.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Goal not found');
  }

  return prisma.user_goals.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      isActive: false,
    },
  });
}

// ==================== PROGRESS ====================

export async function addProgress(userId: string, goalId: string, input: AddProgressInput) {
  const goal = await prisma.user_goals.findFirst({
    where: { id: goalId, userId },
  });

  if (!goal) {
    throw new Error('Goal not found');
  }

  const date = input.date ? new Date(input.date) : new Date();
  date.setHours(0, 0, 0, 0);

  // Create progress record
  const progress = await prisma.goal_progress.create({
    data: {
      goalId,
      value: input.value,
      date,
      source: input.source,
      sourceId: input.sourceId,
      note: input.note,
    },
  });

  // Update goal current value
  const newValue = goal.currentValue + input.value;
  const isCompleted = newValue >= goal.targetValue;

  await prisma.user_goals.update({
    where: { id: goalId },
    data: {
      currentValue: newValue,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return progress;
}

export async function getProgress(userId: string, goalId: string, filters: ProgressFilters) {
  const goal = await prisma.user_goals.findFirst({
    where: { id: goalId, userId },
  });

  if (!goal) {
    throw new Error('Goal not found');
  }

  const { startDate, endDate, page, limit } = filters;

  const where: any = { goalId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [progress, total] = await Promise.all([
    prisma.goal_progress.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.goal_progress.count({ where }),
  ]);

  return {
    progress,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== AUTO PROGRESS UPDATE ====================

export async function updateProgressFromActivity(
  userId: string,
  activityType: 'meditation' | 'breathwork' | 'session' | 'mood' | 'journal' | 'sleep',
  value: number,
  sourceId?: string
) {
  // Find matching active goals
  const goalTypes: GoalType[] = [];

  switch (activityType) {
    case 'meditation':
      goalTypes.push('MEDITATION_COUNT', 'PRACTICE_MINUTES', 'PRACTICE_DAYS');
      break;
    case 'breathwork':
      goalTypes.push('BREATHWORK_COUNT', 'PRACTICE_DAYS');
      break;
    case 'session':
      goalTypes.push('PRACTICE_MINUTES', 'PRACTICE_DAYS');
      break;
    case 'mood':
      goalTypes.push('MOOD_LOG');
      break;
    case 'journal':
      goalTypes.push('JOURNAL_ENTRIES');
      break;
    case 'sleep':
      goalTypes.push('SLEEP_TRACKING');
      break;
  }

  const goals = await prisma.user_goals.findMany({
    where: {
      userId,
      isActive: true,
      isCompleted: false,
      type: { in: goalTypes },
    },
  });

  for (const goal of goals) {
    let progressValue = value;

    // For PRACTICE_DAYS, check if already logged today
    if (goal.type === 'PRACTICE_DAYS') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingProgress = await prisma.goal_progress.findFirst({
        where: {
          goalId: goal.id,
          date: today,
        },
      });

      if (existingProgress) continue; // Already logged today
      progressValue = 1;
    }

    await addProgress(userId, goal.id, {
      value: progressValue,
      source: activityType,
      sourceId,
    });
  }
}

// ==================== TEMPLATES & SUGGESTIONS ====================

export function getGoalTemplates() {
  return [
    {
      type: 'PRACTICE_DAYS',
      title: 'Haftada 5 Gün Pratik',
      titleEn: 'Practice 5 Days a Week',
      targetValue: 5,
      unit: 'gün',
      period: 'WEEKLY',
      icon: '🎯',
    },
    {
      type: 'PRACTICE_MINUTES',
      title: 'Günde 20 Dakika',
      titleEn: '20 Minutes Daily',
      targetValue: 20,
      unit: 'dakika',
      period: 'DAILY',
      icon: '⏱️',
    },
    {
      type: 'STREAK',
      title: '30 Günlük Seri',
      titleEn: '30 Day Streak',
      targetValue: 30,
      unit: 'gün',
      period: 'CUSTOM',
      icon: '🔥',
    },
    {
      type: 'MEDITATION_COUNT',
      title: 'Haftada 7 Meditasyon',
      titleEn: '7 Meditations per Week',
      targetValue: 7,
      unit: 'meditasyon',
      period: 'WEEKLY',
      icon: '🧘',
    },
    {
      type: 'MOOD_LOG',
      title: 'Her Gün Mood Kaydet',
      titleEn: 'Log Mood Daily',
      targetValue: 1,
      unit: 'kayıt',
      period: 'DAILY',
      icon: '😊',
    },
    {
      type: 'JOURNAL_ENTRIES',
      title: 'Haftada 3 Günlük',
      titleEn: '3 Journal Entries per Week',
      targetValue: 3,
      unit: 'giriş',
      period: 'WEEKLY',
      icon: '📝',
    },
    {
      type: 'BREATHWORK_COUNT',
      title: 'Haftada 5 Nefes Egzersizi',
      titleEn: '5 Breathwork Sessions per Week',
      targetValue: 5,
      unit: 'egzersiz',
      period: 'WEEKLY',
      icon: '🌬️',
    },
  ];
}

export async function getSuggestions(userId: string) {
  // Get user's onboarding data for personalized suggestions
  const onboarding = await prisma.user_onboarding.findUnique({
    where: { userId },
  });

  const suggestions = [];
  const templates = getGoalTemplates();

  // Get existing active goals
  const existingGoals = await prisma.user_goals.findMany({
    where: { userId, isActive: true },
    select: { type: true },
  });

  const existingTypes = existingGoals.map((g) => g.type);

  // Filter templates based on what user doesn't have
  for (const template of templates) {
    if (!existingTypes.includes(template.type as GoalType)) {
      // Prioritize based on onboarding goals
      let priority = 0;
      if (onboarding?.goals.includes('STRESS_RELIEF') && template.type === 'MEDITATION_COUNT') {
        priority = 10;
      }
      if (onboarding?.goals.includes('MINDFULNESS') && template.type === 'MOOD_LOG') {
        priority = 10;
      }

      suggestions.push({ ...template, priority });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}
