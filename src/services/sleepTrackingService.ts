import { prisma } from '../utils/database';
import type {
  CreateSleepTrackingInput,
  UpdateSleepTrackingInput,
  SleepTrackingFilters,
  SleepStatsQuery,
} from '../validation/sleepTrackingSchemas';

// ==================== SLEEP TRACKING ====================

export async function getSleepTracking(userId: string, filters: SleepTrackingFilters) {
  const { startDate, endDate, page, limit } = filters;

  const where: any = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [records, total] = await Promise.all([
    prisma.sleep_tracking.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.sleep_tracking.count({ where }),
  ]);

  return {
    records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSleepTrackingById(userId: string, id: string) {
  return prisma.sleep_tracking.findFirst({
    where: { id, userId },
  });
}

export async function createSleepTracking(userId: string, input: CreateSleepTrackingInput) {
  const bedTime = new Date(input.bedTime);
  const wakeTime = new Date(input.wakeTime);
  const date = new Date(input.date);
  date.setHours(0, 0, 0, 0);

  // Calculate total minutes
  const totalMinutes = Math.round((wakeTime.getTime() - bedTime.getTime()) / (1000 * 60));

  if (totalMinutes < 0) {
    throw new Error('Wake time must be after bed time');
  }

  return prisma.sleep_tracking.create({
    data: {
      userId,
      date,
      bedTime,
      wakeTime,
      totalMinutes,
      quality: input.quality,
      fellAsleepWith: input.fellAsleepWith,
      contentId: input.contentId,
      notes: input.notes,
      dreamNote: input.dreamNote,
      tags: input.tags,
    },
  });
}

export async function updateSleepTracking(userId: string, id: string, input: UpdateSleepTrackingInput) {
  const existing = await prisma.sleep_tracking.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Sleep tracking record not found');
  }

  let totalMinutes = existing.totalMinutes;
  if (input.bedTime || input.wakeTime) {
    const bedTime = input.bedTime ? new Date(input.bedTime) : existing.bedTime;
    const wakeTime = input.wakeTime ? new Date(input.wakeTime) : existing.wakeTime;
    totalMinutes = Math.round((wakeTime.getTime() - bedTime.getTime()) / (1000 * 60));

    if (totalMinutes < 0) {
      throw new Error('Wake time must be after bed time');
    }
  }

  return prisma.sleep_tracking.update({
    where: { id },
    data: {
      ...input,
      date: input.date ? new Date(input.date) : undefined,
      bedTime: input.bedTime ? new Date(input.bedTime) : undefined,
      wakeTime: input.wakeTime ? new Date(input.wakeTime) : undefined,
      totalMinutes,
    },
  });
}

export async function deleteSleepTracking(userId: string, id: string) {
  const existing = await prisma.sleep_tracking.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Sleep tracking record not found');
  }

  return prisma.sleep_tracking.delete({
    where: { id },
  });
}

// ==================== SLEEP STATS ====================

export async function getSleepStats(userId: string, query: SleepStatsQuery) {
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

  const records = await prisma.sleep_tracking.findMany({
    where: {
      userId,
      date: { gte: dateFrom, lte: dateTo },
    },
    orderBy: { date: 'asc' },
  });

  const totalRecords = records.length;
  if (totalRecords === 0) {
    return {
      period,
      dateFrom,
      dateTo,
      totalRecords: 0,
      avgSleepMinutes: 0,
      avgSleepHours: 0,
      avgQuality: null,
      totalSleepMinutes: 0,
      fellAsleepWithDistribution: {},
      qualityDistribution: {},
      dailyData: [],
    };
  }

  const totalSleepMinutes = records.reduce((acc, r) => acc + r.totalMinutes, 0);
  const avgSleepMinutes = Math.round(totalSleepMinutes / totalRecords);
  const avgSleepHours = Math.round((avgSleepMinutes / 60) * 10) / 10;

  // Quality average
  const qualityRecords = records.filter((r) => r.quality !== null);
  const avgQuality = qualityRecords.length > 0
    ? Math.round((qualityRecords.reduce((acc, r) => acc + (r.quality ?? 0), 0) / qualityRecords.length) * 10) / 10
    : null;

  // Fell asleep with distribution
  const fellAsleepWithDistribution: Record<string, number> = {};
  records.forEach((r) => {
    const key = r.fellAsleepWith ?? 'nothing';
    fellAsleepWithDistribution[key] = (fellAsleepWithDistribution[key] || 0) + 1;
  });

  // Quality distribution
  const qualityDistribution: Record<number, number> = {};
  records.forEach((r) => {
    if (r.quality !== null) {
      qualityDistribution[r.quality] = (qualityDistribution[r.quality] || 0) + 1;
    }
  });

  // Daily data
  const dailyData = records.map((r) => ({
    date: r.date,
    totalMinutes: r.totalMinutes,
    hours: Math.round((r.totalMinutes / 60) * 10) / 10,
    quality: r.quality,
    bedTime: r.bedTime,
    wakeTime: r.wakeTime,
  }));

  return {
    period,
    dateFrom,
    dateTo,
    totalRecords,
    avgSleepMinutes,
    avgSleepHours,
    avgQuality,
    totalSleepMinutes,
    fellAsleepWithDistribution,
    qualityDistribution,
    dailyData,
  };
}

export async function getTodaySleep(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.sleep_tracking.findFirst({
    where: {
      userId,
      date: today,
    },
  });
}

export async function getLastNightSleep(userId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  return prisma.sleep_tracking.findFirst({
    where: {
      userId,
      date: yesterday,
    },
  });
}
