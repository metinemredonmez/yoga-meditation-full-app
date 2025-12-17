import { prisma } from '../utils/database';
import { LiveStreamType } from '@prisma/client';
import { logger } from '../utils/logger';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import * as liveStreamService from './liveStreamService';

// ============================================
// Types
// ============================================

export interface CreateScheduleInput {
  title: string;
  description?: string;
  type: LiveStreamType;
  recurrenceRule: string;
  dayOfWeek: number[];
  startTime: string;
  duration: number;
  timezone?: string;
}

export interface UpdateScheduleInput {
  title?: string;
  description?: string;
  type?: LiveStreamType;
  recurrenceRule?: string;
  dayOfWeek?: number[];
  startTime?: string;
  duration?: number;
  timezone?: string;
  isActive?: boolean;
}

// ============================================
// Schedule CRUD
// ============================================

export async function createSchedule(instructorId: string, data: CreateScheduleInput) {
  // Parse and validate the recurrence rule
  try {
    rrulestr(data.recurrenceRule);
  } catch {
    throw new Error('Invalid recurrence rule');
  }

  // Validate start time format
  if (!/^\d{2}:\d{2}$/.test(data.startTime)) {
    throw new Error('Invalid start time format. Use HH:mm');
  }

  const schedule = await prisma.liveStreamSchedule.create({
    data: {
      instructorId,
      title: data.title,
      description: data.description,
      type: data.type,
      recurrenceRule: data.recurrenceRule,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      duration: data.duration,
      timezone: data.timezone || 'Europe/Istanbul',
      isActive: true,
    },
    include: {
      instructor: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  // Calculate next stream date
  const nextStreamAt = calculateNextStreamDate(schedule);
  if (nextStreamAt) {
    await prisma.liveStreamSchedule.update({
      where: { id: schedule.id },
      data: { nextStreamAt },
    });
  }

  logger.info({ scheduleId: schedule.id, instructorId }, 'Created recurring schedule');
  return { ...schedule, nextStreamAt };
}

export async function updateSchedule(
  scheduleId: string,
  instructorId: string,
  data: UpdateScheduleInput,
) {
  const schedule = await prisma.liveStreamSchedule.findFirst({
    where: { id: scheduleId, instructorId },
  });

  if (!schedule) {
    throw new Error('Schedule not found or not authorized');
  }

  if (data.recurrenceRule) {
    try {
      rrulestr(data.recurrenceRule);
    } catch {
      throw new Error('Invalid recurrence rule');
    }
  }

  if (data.startTime && !/^\d{2}:\d{2}$/.test(data.startTime)) {
    throw new Error('Invalid start time format. Use HH:mm');
  }

  const updated = await prisma.liveStreamSchedule.update({
    where: { id: scheduleId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.recurrenceRule && { recurrenceRule: data.recurrenceRule }),
      ...(data.dayOfWeek && { dayOfWeek: data.dayOfWeek }),
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  // Recalculate next stream date
  const nextStreamAt = calculateNextStreamDate(updated);
  if (nextStreamAt) {
    await prisma.liveStreamSchedule.update({
      where: { id: scheduleId },
      data: { nextStreamAt },
    });
  }

  logger.info({ scheduleId, instructorId }, 'Updated recurring schedule');
  return { ...updated, nextStreamAt };
}

export async function deleteSchedule(scheduleId: string, instructorId: string) {
  const schedule = await prisma.liveStreamSchedule.findFirst({
    where: { id: scheduleId, instructorId },
  });

  if (!schedule) {
    throw new Error('Schedule not found or not authorized');
  }

  await prisma.liveStreamSchedule.delete({
    where: { id: scheduleId },
  });

  logger.info({ scheduleId, instructorId }, 'Deleted recurring schedule');
}

export async function getScheduleById(scheduleId: string) {
  return prisma.liveStreamSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      instructor: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

export async function getInstructorSchedules(instructorId: string) {
  return prisma.liveStreamSchedule.findMany({
    where: { instructorId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getActiveSchedules() {
  return prisma.liveStreamSchedule.findMany({
    where: { isActive: true },
    include: {
      instructor: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { nextStreamAt: 'asc' },
  });
}

// ============================================
// Stream Generation
// ============================================

export async function generateUpcomingStreams(scheduleId: string, count: number = 4) {
  const schedule = await prisma.liveStreamSchedule.findUnique({
    where: { id: scheduleId },
    include: { instructor: true },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  if (!schedule.isActive) {
    throw new Error('Schedule is not active');
  }

  const dates = getUpcomingDates(schedule, count);
  const createdStreams = [];

  for (const date of dates) {
    // Check if stream already exists for this date
    const existingStream = await prisma.liveStream.findFirst({
      where: {
        instructorId: schedule.instructorId,
        scheduledStartAt: date.start,
      },
    });

    if (existingStream) {
      continue;
    }

    try {
      const stream = await liveStreamService.createStream(schedule.instructorId, {
        title: schedule.title,
        description: schedule.description || undefined,
        type: schedule.type,
        scheduledStartAt: date.start,
        scheduledEndAt: date.end,
      });

      createdStreams.push(stream);
    } catch (error) {
      logger.error({ error, scheduleId, date }, 'Failed to create scheduled stream');
    }
  }

  // Update next stream date
  const nextStreamAt = calculateNextStreamDate(schedule);
  if (nextStreamAt) {
    await prisma.liveStreamSchedule.update({
      where: { id: scheduleId },
      data: { nextStreamAt },
    });
  }

  logger.info({ scheduleId, count: createdStreams.length }, 'Generated upcoming streams');
  return createdStreams;
}

export async function processRecurringStreams() {
  const schedules = await prisma.liveStreamSchedule.findMany({
    where: {
      isActive: true,
      nextStreamAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      },
    },
  });

  let totalCreated = 0;

  for (const schedule of schedules) {
    try {
      const streams = await generateUpcomingStreams(schedule.id, 2);
      totalCreated += streams.length;
    } catch (error) {
      logger.error({ error, scheduleId: schedule.id }, 'Failed to process recurring schedule');
    }
  }

  logger.info({ processedSchedules: schedules.length, totalCreated }, 'Processed recurring streams');
  return { processedSchedules: schedules.length, totalCreated };
}

// ============================================
// Helper Functions
// ============================================

function calculateNextStreamDate(schedule: {
  recurrenceRule: string;
  startTime: string;
  timezone: string;
}): Date | null {
  try {
    const rule = rrulestr(schedule.recurrenceRule);
    const now = new Date();

    // Get next occurrence
    const next = rule.after(now);
    if (!next) {
      return null;
    }

    // Apply start time
    const timeParts = schedule.startTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    next.setHours(hours, minutes, 0, 0);

    return next;
  } catch (error) {
    logger.error({ error }, 'Failed to calculate next stream date');
    return null;
  }
}

function getUpcomingDates(
  schedule: {
    recurrenceRule: string;
    startTime: string;
    duration: number;
    timezone: string;
  },
  count: number,
): Array<{ start: Date; end: Date }> {
  try {
    const rule = rrulestr(schedule.recurrenceRule);
    const now = new Date();
    const dates: Array<{ start: Date; end: Date }> = [];

    // Get next occurrences
    const occurrences = rule.between(now, new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), true);

    for (let i = 0; i < Math.min(count, occurrences.length); i++) {
      const occurrenceDate = occurrences[i];
      if (!occurrenceDate) continue;
      const occurrence = new Date(occurrenceDate);

      // Apply start time
      const timeParts = schedule.startTime.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      occurrence.setHours(hours, minutes, 0, 0);

      // Skip if in the past
      if (occurrence <= now) {
        continue;
      }

      const endTime = new Date(occurrence.getTime() + schedule.duration * 60 * 1000);

      dates.push({
        start: occurrence,
        end: endTime,
      });

      if (dates.length >= count) {
        break;
      }
    }

    return dates;
  } catch (error) {
    logger.error({ error }, 'Failed to get upcoming dates');
    return [];
  }
}

export function createWeeklyRule(daysOfWeek: number[]): string {
  const dayMap: Record<number, string> = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  };

  const days = daysOfWeek.map(d => dayMap[d]).join(',');
  return `FREQ=WEEKLY;BYDAY=${days}`;
}

export function createDailyRule(): string {
  return 'FREQ=DAILY';
}

export function createMonthlyRule(dayOfMonth: number): string {
  return `FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`;
}
