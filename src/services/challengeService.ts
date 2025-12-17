import { Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import type {
  CreateChallengeInput,
  UpdateChallengeInput,
  ChallengeCheckInput,
} from '../validation/challengeSchemas';
import { eventEmitter } from '../utils/eventEmitter';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapChallengeSummary(
  challenge: Prisma.ChallengeGetPayload<{
    include: {
      _count: { select: { enrollments: true } };
      enrollments?: true;
    };
  }> & { enrolled?: boolean },
) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    startAt: challenge.startAt,
    endAt: challenge.endAt,
    targetDays: challenge.targetDays,
    coverUrl: challenge.coverUrl,
    enrollmentCount: challenge._count.enrollments,
    enrolled: Boolean(challenge.enrolled),
  };
}

export async function listChallenges(userId?: string) {
  const challenges = await prisma.challenge.findMany({
    orderBy: { startAt: 'asc' },
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
      enrollments: userId
        ? {
            where: {
              userId,
            },
          }
        : false,
    },
  });

  return challenges.map((challenge) =>
    mapChallengeSummary({
      ...challenge,
      enrolled: userId ? challenge.enrollments.length > 0 : false,
    }),
  );
}

export async function getChallengeById(challengeId: string, userId?: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      _count: {
        select: {
          enrollments: true,
          checks: true,
        },
      },
      enrollments: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
      checks: userId
        ? {
            where: { userId },
            select: { date: true },
          }
        : false,
    },
  });

  if (!challenge) {
    return null;
  }

  const completedDays = userId && challenge.checks ? challenge.checks.length : undefined;

  return {
    ...mapChallengeSummary({
      ...challenge,
      _count: { enrollments: challenge._count.enrollments },
      enrolled: userId ? Boolean(challenge.enrollments?.length) : false,
    }),
    completedDays,
    totalCompletions: challenge._count.checks,
  };
}

export async function createChallenge(data: CreateChallengeInput) {
  const challenge = await prisma.challenge.create({
    data: {
      title: data.title,
      description: data.description,
      startAt: toDate(data.startAt),
      endAt: toDate(data.endAt),
      targetDays: data.targetDays,
      coverUrl: data.coverUrl ?? null,
    },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  // Emit challenge created event
  eventEmitter.emit('challenge.created', {
    challengeId: challenge.id,
    title: challenge.title,
    startAt: challenge.startAt,
    endAt: challenge.endAt,
    targetDays: challenge.targetDays,
  });

  return mapChallengeSummary({ ...challenge, enrollments: [], enrolled: false });
}

export async function updateChallenge(challengeId: string, data: UpdateChallengeInput) {
  const challenge = await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.startAt ? { startAt: toDate(data.startAt) } : {}),
      ...(data.endAt ? { endAt: toDate(data.endAt) } : {}),
      ...(typeof data.targetDays === 'number' ? { targetDays: data.targetDays } : {}),
      ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl } : {}),
    },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  return mapChallengeSummary({ ...challenge, enrollments: [], enrolled: false });
}

export async function deleteChallenge(challengeId: string) {
  await prisma.challenge.delete({ where: { id: challengeId } });
}

export async function joinChallenge(userId: string, challengeId: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });

  if (!challenge) {
    const error = new Error('Challenge not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const now = new Date();
  if (challenge.startAt > now) {
    throw new Error('Challenge has not started yet');
  }

  const enrollment = await prisma.challengeEnrollment.create({
    data: {
      userId,
      challengeId,
    },
  });

  // Emit challenge enrollment event
  eventEmitter.emit('challenge.enrollment', {
    enrollmentId: enrollment.id,
    userId,
    challengeId,
    challengeTitle: challenge.title,
    enrolledAt: enrollment.joinedAt,
  });
}

export async function logChallengeDailyCheck(
  userId: string,
  challengeId: string,
  data: ChallengeCheckInput,
) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      enrollments: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!challenge) {
    const error = new Error('Challenge not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (!challenge.enrollments.length) {
    const error = new Error('User not enrolled in challenge');
    error.name = 'NotEnrolledError';
    throw error;
  }

  const date = data.date ? startOfDay(new Date(data.date)) : startOfDay(new Date());

  let session = null;
  if (data.programSessionId) {
    session = await prisma.programSession.findUnique({
      where: { id: data.programSessionId },
      select: { id: true },
    });

    if (!session) {
      const error = new Error('Program session not found');
      error.name = 'ProgramSessionNotFound';
      throw error;
    }
  }

  const existing = await prisma.dailyCheck.findFirst({
    where: {
      userId,
      challengeId,
      date,
    },
  });

  const payload: Prisma.DailyCheckUncheckedCreateInput = {
    userId,
    challengeId,
    programSessionId: session?.id ?? null,
    date,
  };

  let check;
  if (existing) {
    check = await prisma.dailyCheck.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    check = await prisma.dailyCheck.create({ data: payload });
  }

  // Emit challenge checkin event
  eventEmitter.emit('challenge.checkin', {
    checkId: check.id,
    userId,
    challengeId,
    challengeTitle: challenge.title,
    date: check.date,
    programSessionId: check.programSessionId,
  });

  // Check if challenge is completed
  const totalChecks = await prisma.dailyCheck.count({
    where: { userId, challengeId },
  });

  if (totalChecks >= challenge.targetDays) {
    eventEmitter.emit('challenge.completed', {
      userId,
      challengeId,
      challengeTitle: challenge.title,
      completedDays: totalChecks,
      targetDays: challenge.targetDays,
      completedAt: new Date(),
    });
  }

  return check;
}
