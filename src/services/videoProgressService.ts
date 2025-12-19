import { LessonType } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const COMPLETION_THRESHOLD = 90; // %90 izleme = tamamlandı

export interface UpdateProgressInput {
  userId: string;
  lessonId: string;
  lessonType: LessonType;
  currentTime: number;
  duration: number;
}

export interface ProgressResult {
  id: string;
  lessonId: string;
  lessonType: LessonType;
  currentTime: number;
  duration: number;
  percentage: number;
  completed: boolean;
  lastWatchedAt: Date;
}

export interface GetUserProgressOptions {
  lessonType?: LessonType | undefined;
  completedOnly?: boolean | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export async function updateProgress({
  userId,
  lessonId,
  lessonType,
  currentTime,
  duration,
}: UpdateProgressInput): Promise<ProgressResult> {
  // Calculate percentage
  const percentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const completed = percentage >= COMPLETION_THRESHOLD;

  const progress = await prisma.video_progress.upsert({
    where: {
      userId_lessonId_lessonType: {
        userId,
        lessonId,
        lessonType,
      },
    },
    create: {
      userId,
      lessonId,
      lessonType,
      currentTime,
      duration,
      percentage,
      completed,
      lastWatchedAt: new Date(),
    },
    update: {
      currentTime,
      duration,
      percentage,
      completed,
      lastWatchedAt: new Date(),
    },
  });

  logger.info(
    {
      userId,
      lessonId,
      lessonType,
      currentTime,
      duration,
      percentage: percentage.toFixed(1),
      completed,
    },
    'Video progress updated',
  );

  return {
    id: progress.id,
    lessonId: progress.lessonId,
    lessonType: progress.lessonType,
    currentTime: progress.currentTime,
    duration: progress.duration,
    percentage: progress.percentage,
    completed: progress.completed,
    lastWatchedAt: progress.lastWatchedAt,
  };
}

export async function getProgress(
  userId: string,
  lessonId: string,
  lessonType: LessonType,
): Promise<ProgressResult | null> {
  const progress = await prisma.video_progress.findUnique({
    where: {
      userId_lessonId_lessonType: {
        userId,
        lessonId,
        lessonType,
      },
    },
  });

  if (!progress) {
    return null;
  }

  return {
    id: progress.id,
    lessonId: progress.lessonId,
    lessonType: progress.lessonType,
    currentTime: progress.currentTime,
    duration: progress.duration,
    percentage: progress.percentage,
    completed: progress.completed,
    lastWatchedAt: progress.lastWatchedAt,
  };
}

export async function getUserProgress(
  userId: string,
  options: GetUserProgressOptions = {},
): Promise<{ items: ProgressResult[]; total: number; page: number; limit: number }> {
  const { lessonType, completedOnly, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(lessonType && { lessonType }),
    ...(completedOnly && { completed: true }),
  };

  const [items, total] = await Promise.all([
    prisma.video_progress.findMany({
      where,
      orderBy: { lastWatchedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.video_progress.count({ where }),
  ]);

  return {
    items: items.map((p) => ({
      id: p.id,
      lessonId: p.lessonId,
      lessonType: p.lessonType,
      currentTime: p.currentTime,
      duration: p.duration,
      percentage: p.percentage,
      completed: p.completed,
      lastWatchedAt: p.lastWatchedAt,
    })),
    total,
    page,
    limit,
  };
}

export async function getCompletedLessons(
  userId: string,
  lessonType?: LessonType,
): Promise<ProgressResult[]> {
  const where = {
    userId,
    completed: true,
    ...(lessonType && { lessonType }),
  };

  const items = await prisma.video_progress.findMany({
    where,
    orderBy: { lastWatchedAt: 'desc' },
  });

  return items.map((p) => ({
    id: p.id,
    lessonId: p.lessonId,
    lessonType: p.lessonType,
    currentTime: p.currentTime,
    duration: p.duration,
    percentage: p.percentage,
    completed: p.completed,
    lastWatchedAt: p.lastWatchedAt,
  }));
}

export async function markAsCompleted(
  userId: string,
  lessonId: string,
  lessonType: LessonType,
): Promise<ProgressResult> {
  const progress = await prisma.video_progress.upsert({
    where: {
      userId_lessonId_lessonType: {
        userId,
        lessonId,
        lessonType,
      },
    },
    create: {
      userId,
      lessonId,
      lessonType,
      currentTime: 0,
      duration: 0,
      percentage: 100,
      completed: true,
      lastWatchedAt: new Date(),
    },
    update: {
      percentage: 100,
      completed: true,
      lastWatchedAt: new Date(),
    },
  });

  logger.info({ userId, lessonId, lessonType }, 'Lesson marked as completed');

  return {
    id: progress.id,
    lessonId: progress.lessonId,
    lessonType: progress.lessonType,
    currentTime: progress.currentTime,
    duration: progress.duration,
    percentage: progress.percentage,
    completed: progress.completed,
    lastWatchedAt: progress.lastWatchedAt,
  };
}

export async function resetProgress(
  userId: string,
  lessonId: string,
  lessonType: LessonType,
): Promise<boolean> {
  try {
    await prisma.video_progress.delete({
      where: {
        userId_lessonId_lessonType: {
          userId,
          lessonId,
          lessonType,
        },
      },
    });

    logger.info({ userId, lessonId, lessonType }, 'Video progress reset');
    return true;
  } catch {
    // Record doesn't exist
    return false;
  }
}

export async function getProgramProgress(
  userId: string,
  programId: string,
): Promise<{
  totalSessions: number;
  completedSessions: number;
  percentage: number;
  sessions: ProgressResult[];
}> {
  // Get all sessions for this program
  const sessions = await prisma.program_sessions.findMany({
    where: { programId },
    select: { id: true },
  });

  const sessionIds = sessions.map((s) => s.id);

  // Get progress for these sessions
  const progressRecords = await prisma.video_progress.findMany({
    where: {
      userId,
      lessonId: { in: sessionIds },
      lessonType: 'PROGRAM_SESSION',
    },
  });

  const completedCount = progressRecords.filter((p) => p.completed).length;
  const totalSessions = sessions.length;
  const percentage = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;

  return {
    totalSessions,
    completedSessions: completedCount,
    percentage,
    sessions: progressRecords.map((p) => ({
      id: p.id,
      lessonId: p.lessonId,
      lessonType: p.lessonType,
      currentTime: p.currentTime,
      duration: p.duration,
      percentage: p.percentage,
      completed: p.completed,
      lastWatchedAt: p.lastWatchedAt,
    })),
  };
}
