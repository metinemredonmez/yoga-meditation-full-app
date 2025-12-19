import { prisma } from '../utils/database';
import type { SessionType, SessionStatus, MoodLevel } from '@prisma/client';
import type {
  StartSessionInput,
  UpdateSessionInput,
  SessionFilters,
  SessionStatsQuery,
} from '../validation/sessionSchemas';

// ==================== SESSION MANAGEMENT ====================

export async function startSession(userId: string, input: StartSessionInput) {
  // Check for existing active session
  const activeSession = await prisma.meditation_sessions.findFirst({
    where: {
      userId,
      status: { in: ['IN_PROGRESS', 'PAUSED'] },
    },
  });

  if (activeSession) {
    throw new Error('You already have an active session');
  }

  return prisma.meditation_sessions.create({
    data: {
      userId,
      meditationId: input.meditationId,
      type: input.type as SessionType,
      targetDuration: input.targetDuration,
      intervalBell: input.intervalBell,
      endBell: input.endBell,
      backgroundSoundId: input.backgroundSoundId,
      backgroundVolume: input.backgroundVolume,
      mood: input.mood as MoodLevel | undefined,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function getActiveSession(userId: string) {
  return prisma.meditation_sessions.findFirst({
    where: {
      userId,
      status: { in: ['IN_PROGRESS', 'PAUSED'] },
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function getSession(userId: string, id: string) {
  return prisma.meditation_sessions.findFirst({
    where: { id, userId },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function updateSession(userId: string, id: string, input: UpdateSessionInput) {
  const session = await prisma.meditation_sessions.findFirst({
    where: { id, userId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  return prisma.meditation_sessions.update({
    where: { id },
    data: {
      actualDuration: input.actualDuration,
      note: input.note,
      mood: input.mood as MoodLevel | undefined,
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function pauseSession(userId: string, id: string) {
  const session = await prisma.meditation_sessions.findFirst({
    where: { id, userId, status: 'IN_PROGRESS' },
  });

  if (!session) {
    throw new Error('Active session not found');
  }

  return prisma.meditation_sessions.update({
    where: { id },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function resumeSession(userId: string, id: string) {
  const session = await prisma.meditation_sessions.findFirst({
    where: { id, userId, status: 'PAUSED' },
  });

  if (!session) {
    throw new Error('Paused session not found');
  }

  return prisma.meditation_sessions.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      pausedAt: null,
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function endSession(userId: string, id: string, actualDuration?: number) {
  const session = await prisma.meditation_sessions.findFirst({
    where: { id, userId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
  });

  if (!session) {
    throw new Error('Active session not found');
  }

  return prisma.meditation_sessions.update({
    where: { id },
    data: {
      status: 'ABANDONED',
      actualDuration: actualDuration ?? session.actualDuration,
      endedAt: new Date(),
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

export async function completeSession(userId: string, id: string, actualDuration: number, note?: string) {
  const session = await prisma.meditation_sessions.findFirst({
    where: { id, userId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
  });

  if (!session) {
    throw new Error('Active session not found');
  }

  // Update meditation play count if applicable
  if (session.meditationId) {
    await prisma.meditations.update({
      where: { id: session.meditationId },
      data: { playCount: { increment: 1 } },
    });
  }

  return prisma.meditation_sessions.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actualDuration,
      note,
      endedAt: new Date(),
      completedAt: new Date(),
    },
    include: {
      meditation: true,
      backgroundSound: true,
    },
  });
}

// ==================== SESSION HISTORY ====================

export async function getSessionHistory(userId: string, filters: SessionFilters) {
  const { type, status, meditationId, startDate, endDate, page, limit } = filters;

  const where: any = { userId };

  if (type) where.type = type;
  if (status) where.status = status;
  if (meditationId) where.meditationId = meditationId;

  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = new Date(startDate);
    if (endDate) where.startedAt.lte = new Date(endDate);
  }

  const [sessions, total] = await Promise.all([
    prisma.meditation_sessions.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        meditation: true,
        backgroundSound: true,
      },
    }),
    prisma.meditation_sessions.count({ where }),
  ]);

  return {
    sessions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== SESSION STATS ====================

export async function getSessionStats(userId: string, query: SessionStatsQuery) {
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
      case 'all':
        dateFrom = new Date('2000-01-01');
        break;
    }
  }

  const sessions = await prisma.meditation_sessions.findMany({
    where: {
      userId,
      startedAt: { gte: dateFrom, lte: dateTo },
      status: 'COMPLETED',
    },
    orderBy: { startedAt: 'asc' },
  });

  const totalSessions = sessions.length;
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.actualDuration, 0) / 60
  );

  // Group by type
  const byType: Record<string, number> = {};
  sessions.forEach((s) => {
    byType[s.type] = (byType[s.type] || 0) + 1;
  });

  // Average session duration
  const avgDuration = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.actualDuration, 0) / totalSessions)
    : 0;

  // Daily data for charts
  const dailyData: Record<string, { count: number; minutes: number }> = {};
  sessions.forEach((s) => {
    const dateKey = s.startedAt.toISOString().split('T')[0]!;
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { count: 0, minutes: 0 };
    }
    dailyData[dateKey]!.count++;
    dailyData[dateKey]!.minutes += Math.round(s.actualDuration / 60);
  });

  return {
    period,
    dateFrom,
    dateTo,
    totalSessions,
    totalMinutes,
    avgDurationSeconds: avgDuration,
    byType,
    dailyData: Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
}
