import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// Event Queries
// ============================================

export async function getActiveEvents() {
  const now = new Date();

  return prisma.seasonalEvent.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: 'asc' },
  });
}

export async function getAllEvents(filters?: {
  isActive?: boolean;
  upcoming?: boolean;
  past?: boolean;
}) {
  const now = new Date();
  const where: any = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.upcoming) {
    where.startDate = { gt: now };
  }

  if (filters?.past) {
    where.endDate = { lt: now };
  }

  return prisma.seasonalEvent.findMany({
    where,
    orderBy: { startDate: 'desc' },
  });
}

export async function getEventById(id: string) {
  return prisma.seasonalEvent.findUnique({
    where: { id },
    include: {
      _count: { select: { participants: true } },
    },
  });
}

export async function getEventBySlug(slug: string) {
  return prisma.seasonalEvent.findUnique({
    where: { slug },
    include: {
      _count: { select: { participants: true } },
    },
  });
}

// ============================================
// Event Participation
// ============================================

export async function joinEvent(userId: string, eventId: string) {
  const event = await prisma.seasonalEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, message: 'Event not found' };
  }

  const now = new Date();
  if (now < event.startDate) {
    return { success: false, message: 'Event has not started yet' };
  }

  if (now > event.endDate) {
    return { success: false, message: 'Event has ended' };
  }

  // Check if already participating
  const existing = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    return { success: false, message: 'Already participating' };
  }

  const participant = await prisma.seasonalEventParticipant.create({
    data: {
      eventId,
      userId,
    },
  });

  logger.info({ userId, eventId }, 'User joined event');

  return { success: true, participant };
}

export async function leaveEvent(userId: string, eventId: string) {
  const participant = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant) {
    return { success: false, message: 'Not participating' };
  }

  await prisma.seasonalEventParticipant.delete({
    where: { id: participant.id },
  });

  return { success: true };
}

// ============================================
// Event Progress
// ============================================

export async function getEventProgress(userId: string, eventId: string) {
  const participant = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: { event: true },
  });

  if (!participant) {
    return null;
  }

  const rewards = participant.event.rewards as any[];
  const currentTier = rewards.find(
    (r) => participant.points >= r.minPoints && participant.points < (r.maxPoints || Infinity),
  );

  const nextTier = rewards.find((r) => r.minPoints > participant.points);

  return {
    ...participant,
    currentTier,
    nextTier,
    pointsToNextTier: nextTier ? nextTier.minPoints - participant.points : null,
  };
}

export async function updateEventProgress(
  userId: string,
  eventId: string,
  points: number,
  taskId?: string,
) {
  const participant = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant) {
    return { success: false, message: 'Not participating in event' };
  }

  // Update completed tasks if taskId provided
  let completedTasks = (participant.completedTasks as string[]) || [];
  if (taskId && !completedTasks.includes(taskId)) {
    completedTasks.push(taskId);
  }

  const updated = await prisma.seasonalEventParticipant.update({
    where: { id: participant.id },
    data: {
      points: { increment: points },
      completedTasks: completedTasks,
    },
  });

  // Update ranks
  await updateEventRanks(eventId);

  logger.info({ userId, eventId, points }, 'Event progress updated');

  return { success: true, participant: updated };
}

async function updateEventRanks(eventId: string) {
  const participants = await prisma.seasonalEventParticipant.findMany({
    where: { eventId },
    orderBy: { points: 'desc' },
  });

  for (let i = 0; i < participants.length; i++) {
    await prisma.seasonalEventParticipant.update({
      where: { id: participants[i]!.id },
      data: { rank: i + 1 },
    });
  }
}

// ============================================
// Event Leaderboard
// ============================================

export async function getEventLeaderboard(
  eventId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const [participants, total] = await Promise.all([
    prisma.seasonalEventParticipant.findMany({
      where: { eventId },
      orderBy: { points: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.seasonalEventParticipant.count({ where: { eventId } }),
  ]);

  const leaderboard = participants.map((p, index) => ({
    rank: skip + index + 1,
    userId: p.userId,
    userName:
      `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() || 'Yogi',
    points: p.points,
    tier: p.tier,
  }));

  return {
    leaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserEventRank(userId: string, eventId: string) {
  const participant = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant) {
    return null;
  }

  const rank = await prisma.seasonalEventParticipant.count({
    where: {
      eventId,
      points: { gt: participant.points },
    },
  });

  return rank + 1;
}

// ============================================
// Event Rewards
// ============================================

export async function claimEventRewards(userId: string, eventId: string) {
  const event = await prisma.seasonalEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, message: 'Event not found' };
  }

  const now = new Date();
  if (now < event.endDate) {
    return { success: false, message: 'Event has not ended yet' };
  }

  const participant = await prisma.seasonalEventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!participant) {
    return { success: false, message: 'Not participating in event' };
  }

  if (participant.tier) {
    return { success: false, message: 'Rewards already claimed' };
  }

  // Determine tier based on points
  const rewards = event.rewards as any[];
  const earnedTier = rewards.find(
    (r) => participant.points >= r.minPoints,
  );

  if (!earnedTier) {
    return { success: false, message: 'No rewards earned' };
  }

  await prisma.seasonalEventParticipant.update({
    where: { id: participant.id },
    data: { tier: earnedTier.name },
  });

  // Process rewards (XP, badges, etc.)
  // This would be implemented based on reward structure

  logger.info({ userId, eventId, tier: earnedTier.name }, 'Event rewards claimed');

  return {
    success: true,
    tier: earnedTier.name,
    rewards: earnedTier.rewards,
  };
}

// ============================================
// User Event History
// ============================================

export async function getEventHistory(userId: string) {
  return prisma.seasonalEventParticipant.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { joinedAt: 'desc' },
  });
}

// ============================================
// Admin Functions
// ============================================

export async function createEvent(data: {
  name: string;
  slug: string;
  description: string;
  bannerImage?: string;
  themeColor?: string;
  startDate: Date;
  endDate: Date;
  rewards: any;
}) {
  return prisma.seasonalEvent.create({ data });
}

export async function updateEvent(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    bannerImage: string;
    themeColor: string;
    startDate: Date;
    endDate: Date;
    rewards: any;
    isActive: boolean;
  }>,
) {
  return prisma.seasonalEvent.update({
    where: { id },
    data,
  });
}

export async function deleteEvent(id: string) {
  // Delete participants first
  await prisma.seasonalEventParticipant.deleteMany({
    where: { eventId: id },
  });

  return prisma.seasonalEvent.delete({
    where: { id },
  });
}

// ============================================
// Event Stats
// ============================================

export async function getEventStats(eventId: string) {
  const [event, participantCount, avgPoints, topParticipant] =
    await Promise.all([
      prisma.seasonalEvent.findUnique({ where: { id: eventId } }),
      prisma.seasonalEventParticipant.count({ where: { eventId } }),
      prisma.seasonalEventParticipant.aggregate({
        where: { eventId },
        _avg: { points: true },
        _sum: { points: true },
      }),
      prisma.seasonalEventParticipant.findFirst({
        where: { eventId },
        orderBy: { points: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

  return {
    event,
    participantCount,
    averagePoints: avgPoints._avg.points || 0,
    totalPoints: avgPoints._sum.points || 0,
    topParticipant: topParticipant
      ? {
          userId: topParticipant.userId,
          name:
            `${topParticipant.user.firstName || ''} ${topParticipant.user.lastName || ''}`.trim() ||
            'Yogi',
          points: topParticipant.points,
        }
      : null,
  };
}
