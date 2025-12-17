import { prisma } from '../../utils/database';
import { ProgramLevel, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

export interface ContentFilters {
  search?: string;
  type?: 'program' | 'class' | 'pose' | 'challenge';
  level?: ProgramLevel;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Get all content with filters
export async function getContent(filters: ContentFilters) {
  const {
    search,
    type,
    level,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const results: {
    programs?: unknown[];
    classes?: unknown[];
    poses?: unknown[];
    challenges?: unknown[];
  } = {};

  if (!type || type === 'program') {
    const where: Prisma.ProgramWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (level) where.level = level;

    results.programs = await prisma.program.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { sessions: true } },
      },
    });
  }

  if (!type || type === 'class') {
    const where: Prisma.ClassWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.classes = await prisma.class.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        users: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { bookings: true } },
      },
    });
  }

  if (!type || type === 'pose') {
    const where: Prisma.PoseWhereInput = {};
    if (search) {
      where.OR = [
        { englishName: { contains: search, mode: 'insensitive' } },
        { sanskritName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.poses = await prisma.pose.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  if (!type || type === 'challenge') {
    const where: Prisma.ChallengeWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.challenges = await prisma.challenge.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { challenge_enrollments: true } },
      },
    });
  }

  return results;
}

// Programs CRUD
export async function getPrograms(filters: ContentFilters) {
  const { search, level, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.ProgramWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (level) where.level = level;

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { sessions: true, comments: true } },
      },
    }),
    prisma.program.count({ where }),
  ]);

  return {
    programs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProgram(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      sessions: true,
      tags: true,
      _count: { select: { sessions: true, comments: true } },
    },
  });

  if (!program) {
    throw new HttpError(404, 'Program not found');
  }

  return program;
}

export async function updateProgram(id: string, data: Prisma.ProgramUpdateInput) {
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Program not found');
  }

  return prisma.program.update({ where: { id }, data });
}

export async function deleteProgram(id: string) {
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Program not found');
  }

  await prisma.program.delete({ where: { id } });
  return { deleted: true, id };
}

// Classes CRUD
export async function getClasses(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.ClassWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.class.count({ where }),
  ]);

  return {
    classes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClass(id: string) {
  const classItem = await prisma.class.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!classItem) {
    throw new HttpError(404, 'Class not found');
  }

  return classItem;
}

export async function updateClass(id: string, data: Prisma.ClassUpdateInput) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Class not found');
  }

  return prisma.class.update({ where: { id }, data });
}

export async function deleteClass(id: string) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Class not found');
  }

  await prisma.class.delete({ where: { id } });
  return { deleted: true, id };
}

// Poses CRUD
export async function getPoses(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.PoseWhereInput = {};
  if (search) {
    where.OR = [
      { englishName: { contains: search, mode: 'insensitive' } },
      { sanskritName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [poses, total] = await Promise.all([
    prisma.pose.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.pose.count({ where }),
  ]);

  return {
    poses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPose(id: string) {
  const pose = await prisma.pose.findUnique({ where: { id } });
  if (!pose) {
    throw new HttpError(404, 'Pose not found');
  }
  return pose;
}

export async function updatePose(id: string, data: Prisma.PoseUpdateInput) {
  const existing = await prisma.pose.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Pose not found');
  }

  return prisma.pose.update({ where: { id }, data });
}

export async function deletePose(id: string) {
  const existing = await prisma.pose.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Pose not found');
  }

  await prisma.pose.delete({ where: { id } });
  return { deleted: true, id };
}

// Challenges CRUD
export async function getChallenges(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.ChallengeWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [challenges, total] = await Promise.all([
    prisma.challenge.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { challenge_enrollments: true } },
      },
    }),
    prisma.challenge.count({ where }),
  ]);

  return {
    challenges,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getChallenge(id: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      _count: { select: { challenge_enrollments: true, daily_checks: true } },
    },
  });

  if (!challenge) {
    throw new HttpError(404, 'Challenge not found');
  }

  return challenge;
}

export async function updateChallenge(id: string, data: Prisma.ChallengeUpdateInput) {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Challenge not found');
  }

  return prisma.challenge.update({ where: { id }, data });
}

export async function deleteChallenge(id: string) {
  const existing = await prisma.challenge.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Challenge not found');
  }

  await prisma.challenge.delete({ where: { id } });
  return { deleted: true, id };
}

// Content stats
export async function getContentStats() {
  const [
    totalPrograms,
    totalClasses,
    totalPoses,
    totalChallenges,
    activeChallenges,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.class.count(),
    prisma.pose.count(),
    prisma.challenge.count(),
    prisma.challenge.count({
      where: {
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
    }),
  ]);

  return {
    totalPrograms,
    totalClasses,
    totalPoses,
    totalChallenges,
    activeChallenges,
  };
}
