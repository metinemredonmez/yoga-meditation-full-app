import { prisma } from '../utils/database';
import type { mood_entries } from '@prisma/client';
import type {
  MoodEntryFilters,
  CreateMoodEntryInput,
  UpdateMoodEntryInput,
  CreateMoodTagInput,
  UpdateMoodTagInput,
  MoodStatsQuery,
} from '../validation/moodSchemas';

// ==================== MOOD ENTRIES ====================

export async function getMoodEntries(userId: string, filters: MoodEntryFilters) {
  const { startDate, endDate, mood, page, limit } = filters;

  const where: any = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (mood) where.mood = mood;

  const [entries, total] = await Promise.all([
    prisma.mood_entries.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.mood_entries.count({ where }),
  ]);

  return {
    entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMoodEntry(userId: string, id: string) {
  return prisma.mood_entries.findFirst({
    where: { id, userId },
  });
}

export async function getTodayMoodEntry(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.mood_entries.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
}

export async function createMoodEntry(userId: string, input: CreateMoodEntryInput) {
  const date = input.date ? new Date(input.date) : new Date();

  return prisma.mood_entries.create({
    data: {
      userId,
      mood: input.mood,
      moodScore: input.moodScore,
      energy: input.energy,
      stress: input.stress,
      notes: input.notes,
      tags: input.tags,
      date,
    },
  });
}

export async function updateMoodEntry(userId: string, id: string, input: UpdateMoodEntryInput) {
  const existing = await prisma.mood_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Mood entry not found');
  }

  return prisma.mood_entries.update({
    where: { id },
    data: input,
  });
}

export async function deleteMoodEntry(userId: string, id: string) {
  const existing = await prisma.mood_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Mood entry not found');
  }

  return prisma.mood_entries.delete({
    where: { id },
  });
}

// ==================== MOOD STATS ====================

export async function getMoodStats(userId: string, query: MoodStatsQuery) {
  const { period, startDate, endDate } = query;

  let dateFrom: Date;
  let dateTo: Date = endDate ? new Date(endDate) : new Date();

  if (startDate) {
    dateFrom = new Date(startDate);
  } else {
    dateFrom = new Date();
    switch (period) {
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'year':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
  }

  const entries = await prisma.mood_entries.findMany({
    where: {
      userId,
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate averages
  const totalEntries = entries.length;
  if (totalEntries === 0) {
    return {
      period,
      dateFrom,
      dateTo,
      totalEntries: 0,
      averageMoodScore: 0,
      averageEnergy: 0,
      averageStress: 0,
      moodDistribution: {},
      dailyData: [],
      topTags: [],
    };
  }

  const sumMood = entries.reduce((acc: number, e: mood_entries) => acc + e.moodScore, 0);
  const sumEnergy = entries.reduce((acc: number, e: mood_entries) => acc + (e.energy || 0), 0);
  const sumStress = entries.reduce((acc: number, e: mood_entries) => acc + (e.stress || 0), 0);
  const energyCount = entries.filter((e: mood_entries) => e.energy !== null).length;
  const stressCount = entries.filter((e: mood_entries) => e.stress !== null).length;

  // Mood distribution
  const moodDistribution: Record<string, number> = {};
  entries.forEach((e: mood_entries) => {
    moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
  });

  // Tag frequency
  const tagCount: Record<string, number> = {};
  entries.forEach((e: mood_entries) => {
    e.tags.forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Daily data for charts
  const dailyData = entries.map((e: mood_entries) => ({
    date: e.date,
    moodScore: e.moodScore,
    energy: e.energy,
    stress: e.stress,
  }));

  return {
    period,
    dateFrom,
    dateTo,
    totalEntries,
    averageMoodScore: Math.round((sumMood / totalEntries) * 10) / 10,
    averageEnergy: energyCount > 0 ? Math.round((sumEnergy / energyCount) * 10) / 10 : null,
    averageStress: stressCount > 0 ? Math.round((sumStress / stressCount) * 10) / 10 : null,
    moodDistribution,
    dailyData,
    topTags,
  };
}

export async function getMoodStreak(userId: string) {
  const entries = await prisma.mood_entries.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 365,
  });

  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if logged today
  const lastEntry = entries[0]!;
  const lastEntryDate = new Date(lastEntry.date);
  lastEntryDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) {
    currentStreak = 1;

    for (let i = 1; i < entries.length; i++) {
      const prevDate = new Date(entries[i - 1]!.date);
      const currDate = new Date(entries[i]!.date);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        tempStreak++;
        if (i < 30) currentStreak = tempStreak; // Only count recent for current streak
      } else if (diff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        break;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
}

// ==================== MOOD TAGS ====================

export async function getMoodTags() {
  return prisma.mood_tags.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
}

export async function getMoodTagsByCategory(category: string) {
  return prisma.mood_tags.findMany({
    where: { category: category as any, isActive: true },
    orderBy: { name: 'asc' },
  });
}

// ==================== ADMIN SERVICES ====================

export async function getAdminMoodTags(page: number = 1, limit: number = 50) {
  const [tags, total] = await Promise.all([
    prisma.mood_tags.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.mood_tags.count(),
  ]);

  return {
    tags,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createMoodTag(input: CreateMoodTagInput) {
  return prisma.mood_tags.create({
    data: input,
  });
}

export async function updateMoodTag(id: string, input: UpdateMoodTagInput) {
  return prisma.mood_tags.update({
    where: { id },
    data: input,
  });
}

export async function deleteMoodTag(id: string) {
  return prisma.mood_tags.delete({
    where: { id },
  });
}

export async function getMoodAnalytics() {
  const [totalEntries, entriesByMood, avgScores] = await Promise.all([
    prisma.mood_entries.count(),
    prisma.mood_entries.groupBy({
      by: ['mood'],
      _count: { mood: true },
    }),
    prisma.mood_entries.aggregate({
      _avg: {
        moodScore: true,
        energy: true,
        stress: true,
      },
    }),
  ]);

  return {
    totalEntries,
    entriesByMood: entriesByMood.map((e: { mood: string; _count: { mood: number } }) => ({ mood: e.mood, count: e._count.mood })),
    averageScores: {
      mood: avgScores._avg.moodScore ? Math.round(avgScores._avg.moodScore * 10) / 10 : 0,
      energy: avgScores._avg.energy ? Math.round(avgScores._avg.energy * 10) / 10 : 0,
      stress: avgScores._avg.stress ? Math.round(avgScores._avg.stress * 10) / 10 : 0,
    },
  };
}
