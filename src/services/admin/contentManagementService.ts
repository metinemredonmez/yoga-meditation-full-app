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
    const where: Prisma.programsWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (level) where.level = level;

    results.programs = await prisma.programs.findMany({
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
    const where: Prisma.classesWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.classes = await prisma.classes.findMany({
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
    const where: Prisma.posesWhereInput = {};
    if (search) {
      where.OR = [
        { englishName: { contains: search, mode: 'insensitive' } },
        { sanskritName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.poses = await prisma.poses.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  if (!type || type === 'challenge') {
    const where: Prisma.challengesWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    results.challenges = await prisma.challenges.findMany({
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

  const where: Prisma.programsWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (level) where.level = level;

  const [programs, total] = await Promise.all([
    prisma.programs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { sessions: true, comments: true } },
      },
    }),
    prisma.programs.count({ where }),
  ]);

  return {
    programs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProgram(id: string) {
  const program = await prisma.programs.findUnique({
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

export async function updateProgram(id: string, data: Prisma.programsUpdateInput) {
  const existing = await prisma.programs.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Program not found');
  }

  return prisma.programs.update({ where: { id }, data });
}

export async function deleteProgram(id: string) {
  const existing = await prisma.programs.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Program not found');
  }

  await prisma.programs.delete({ where: { id } });
  return { deleted: true, id };
}

// Classes CRUD
export async function getClasses(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.classesWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [classes, total] = await Promise.all([
    prisma.classes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.classes.count({ where }),
  ]);

  return {
    classes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClass(id: string) {
  const classItem = await prisma.classes.findUnique({
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

export async function updateClass(id: string, data: Prisma.classesUpdateInput) {
  const existing = await prisma.classes.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Class not found');
  }

  return prisma.classes.update({ where: { id }, data });
}

export async function deleteClass(id: string) {
  const existing = await prisma.classes.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Class not found');
  }

  await prisma.classes.delete({ where: { id } });
  return { deleted: true, id };
}

// Poses CRUD
export async function getPoses(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.posesWhereInput = {};
  if (search) {
    where.OR = [
      { englishName: { contains: search, mode: 'insensitive' } },
      { sanskritName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [poses, total] = await Promise.all([
    prisma.poses.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.poses.count({ where }),
  ]);

  return {
    poses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPose(id: string) {
  const pose = await prisma.poses.findUnique({ where: { id } });
  if (!pose) {
    throw new HttpError(404, 'Pose not found');
  }
  return pose;
}

export async function updatePose(id: string, data: Prisma.posesUpdateInput) {
  const existing = await prisma.poses.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Pose not found');
  }

  return prisma.poses.update({ where: { id }, data });
}

export async function deletePose(id: string) {
  const existing = await prisma.poses.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Pose not found');
  }

  await prisma.poses.delete({ where: { id } });
  return { deleted: true, id };
}

// Challenges CRUD
export async function getChallenges(filters: ContentFilters) {
  const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

  const where: Prisma.challengesWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [challenges, total] = await Promise.all([
    prisma.challenges.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { challenge_enrollments: true } },
      },
    }),
    prisma.challenges.count({ where }),
  ]);

  return {
    challenges,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getChallenge(id: string) {
  const challenge = await prisma.challenges.findUnique({
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

export async function updateChallenge(id: string, data: Prisma.challengesUpdateInput) {
  const existing = await prisma.challenges.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Challenge not found');
  }

  return prisma.challenges.update({ where: { id }, data });
}

export async function deleteChallenge(id: string) {
  const existing = await prisma.challenges.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Challenge not found');
  }

  await prisma.challenges.delete({ where: { id } });
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
    prisma.programs.count(),
    prisma.classes.count(),
    prisma.poses.count(),
    prisma.challenges.count(),
    prisma.challenges.count({
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
