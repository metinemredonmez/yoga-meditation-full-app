import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type {
  BreathworkFilters,
  UpdateBreathworkProgressInput,
  CompleteBreathworkSessionInput,
  CreateBreathworkInput,
  UpdateBreathworkInput,
} from '../validation/breathworkSchemas';
import { BreathworkPattern, BreathworkCategory, BreathworkAnimation, Prisma } from '@prisma/client';

// ==================== USER ENDPOINTS ====================

/**
 * Get list of breathwork exercises with filters and pagination
 */
export async function getBreathworks(filters: BreathworkFilters) {
  const {
    category,
    pattern,
    isFree,
    isFeatured,
    minDuration,
    maxDuration,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = filters;

  const skip = (page - 1) * limit;

  // Map sortBy to actual field names
  const sortFieldMap: Record<string, string> = {
    'durationSeconds': 'totalDuration',
    'createdAt': 'createdAt',
    'title': 'title',
    'playCount': 'playCount',
  };
  const actualSortBy = sortFieldMap[sortBy] || 'createdAt';

  const where: Prisma.breathworksWhereInput = {
    isPublished: true,
    ...(category && { category: category as BreathworkCategory }),
    ...(pattern && { pattern: pattern as BreathworkPattern }),
    ...(isFree !== undefined && { isPremium: !isFree }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(minDuration && { totalDuration: { gte: minDuration } }),
    ...(maxDuration && { totalDuration: { lte: maxDuration } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const orderBy: Prisma.breathworksOrderByWithRelationInput = {
    [actualSortBy]: sortOrder,
  };

  const [breathworks, total] = await Promise.all([
    prisma.breathworks.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.breathworks.count({ where }),
  ]);

  return {
    breathworks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get featured breathwork exercises
 */
export async function getFeaturedBreathworks(limit: number = 10) {
  return prisma.breathworks.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get breathwork categories with counts
 */
export async function getBreathworkCategories() {
  const categories = Object.values(BreathworkCategory);
  const counts = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.breathworks.count({
        where: { category, isPublished: true },
      });
      return { category, count };
    })
  );
  return counts;
}

/**
 * Search breathwork exercises
 */
export async function searchBreathworks(query: string, limit: number = 20) {
  return prisma.breathworks.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { titleEn: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { playCount: 'desc' },
    take: limit,
  });
}

/**
 * Get breathwork detail
 */
export async function getBreathwork(id: string, userId?: string) {
  const breathwork = await prisma.breathworks.findUnique({
    where: { id },
  });

  if (!breathwork || !breathwork.isPublished) return null;

  // Get user-specific data if authenticated
  let userProgress = null;

  if (userId) {
    userProgress = await prisma.breathwork_progress.findUnique({
      where: { breathworkId_userId: { breathworkId: id, userId } },
    });
  }

  return {
    ...breathwork,
    userProgress,
  };
}

/**
 * Get breathwork exercises by category
 */
export async function getBreathworksByCategory(category: string, limit: number = 10) {
  return prisma.breathworks.findMany({
    where: {
      isPublished: true,
      category: category as BreathworkCategory,
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
}

/**
 * Start a breathwork session
 */
export async function startSession(userId: string, breathworkId: string) {
  // Check if breathwork exists
  const breathwork = await prisma.breathworks.findUnique({
    where: { id: breathworkId },
  });

  if (!breathwork || !breathwork.isPublished) {
    throw new Error('Breathwork not found');
  }

  // Create or get progress record
  const progress = await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId, userId } },
    create: {
      breathworkId,
      userId,
      totalSessions: 0,
      totalCycles: 0,
      totalSeconds: 0,
    },
    update: {
      lastPracticedAt: new Date(),
    },
  });

  // Create session record
  const session = await prisma.breathwork_sessions.create({
    data: {
      breathworkId,
      userId,
    },
  });

  // Increment play count
  await prisma.breathworks.update({
    where: { id: breathworkId },
    data: { playCount: { increment: 1 } },
  });

  return { session, progress };
}

/**
 * Update breathwork progress
 */
export async function updateProgress(
  userId: string,
  breathworkId: string,
  input: UpdateBreathworkProgressInput
) {
  const { progressSeconds, cyclesCompleted, completed } = input;

  return prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId, userId } },
    create: {
      breathworkId,
      userId,
      totalSessions: completed ? 1 : 0,
      totalCycles: cyclesCompleted || 0,
      totalSeconds: progressSeconds,
    },
    update: {
      totalSeconds: { increment: progressSeconds },
      ...(cyclesCompleted !== undefined && { totalCycles: { increment: cyclesCompleted } }),
      ...(completed && { totalSessions: { increment: 1 } }),
      lastPracticedAt: new Date(),
    },
  });
}

/**
 * Complete a breathwork session
 */
export async function completeSession(
  userId: string,
  breathworkId: string,
  sessionId: string,
  input: CompleteBreathworkSessionInput
) {
  const { practicedSeconds, cyclesCompleted } = input;

  // Get the breathwork to calculate XP
  const breathwork = await prisma.breathworks.findUnique({
    where: { id: breathworkId },
    select: { totalDuration: true, cycles: true },
  });

  if (!breathwork) {
    throw new Error('Breathwork not found');
  }

  // Update session
  const session = await prisma.breathwork_sessions.update({
    where: { id: sessionId },
    data: {
      duration: practicedSeconds,
      cyclesCompleted,
      completed: true,
    },
  });

  // Update progress
  const progress = await prisma.breathwork_progress.upsert({
    where: { breathworkId_userId: { breathworkId, userId } },
    create: {
      breathworkId,
      userId,
      totalSessions: 1,
      totalCycles: cyclesCompleted,
      totalSeconds: practicedSeconds,
    },
    update: {
      totalSessions: { increment: 1 },
      totalCycles: { increment: cyclesCompleted },
      totalSeconds: { increment: practicedSeconds },
      lastPracticedAt: new Date(),
    },
  });

  // Calculate XP earned (15 XP per minute practiced + 5 XP per cycle)
  // Note: XP tracking can be added through gamification_points table if needed
  const xpEarned = Math.floor(practicedSeconds / 60) * 15 + cyclesCompleted * 5;

  return { session, progress, xpEarned };
}

/**
 * Get user's breathwork history
 */
export async function getHistory(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.breathwork_sessions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        breathwork: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            category: true,
            pattern: true,
            totalDuration: true,
            coverImage: true,
          },
        },
      },
    }),
    prisma.breathwork_sessions.count({ where: { userId } }),
  ]);

  return {
    history: sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get breathwork exercises in progress (based on sessions)
 */
export async function getContinueBreathworks(userId: string, limit: number = 10) {
  const progress = await prisma.breathwork_progress.findMany({
    where: {
      userId,
      totalSessions: { gt: 0 },
    },
    orderBy: { lastPracticedAt: 'desc' },
    take: limit,
    include: {
      breathwork: true,
    },
  });

  return progress.map((p) => ({
    ...p.breathwork,
    totalSessions: p.totalSessions,
    totalCycles: p.totalCycles,
    totalSeconds: p.totalSeconds,
    lastPracticedAt: p.lastPracticedAt,
  }));
}

/**
 * Get user's breathwork stats
 */
export async function getUserStats(userId: string) {
  const [totalSessions, totalPracticeTime, completedToday, streak] = await Promise.all([
    prisma.breathwork_sessions.count({
      where: { userId, completed: true },
    }),
    prisma.breathwork_sessions.aggregate({
      where: { userId, completed: true },
      _sum: { duration: true },
    }),
    prisma.breathwork_sessions.count({
      where: {
        userId,
        completed: true,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Calculate streak (consecutive days)
    calculateStreak(userId),
  ]);

  return {
    totalSessions,
    totalPracticeMinutes: Math.floor((totalPracticeTime._sum.duration || 0) / 60),
    completedToday,
    streak,
  };
}

async function calculateStreak(userId: string): Promise<number> {
  const sessions = await prisma.breathwork_sessions.findMany({
    where: { userId, completed: true },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 365, // Max 1 year
  });

  if (sessions.length === 0) return 0;

  const uniqueDays = new Set<string>();
  sessions.forEach((s) => {
    if (s.createdAt) {
      const dateStr = s.createdAt.toISOString().split('T')[0] as string;
      uniqueDays.add(dateStr);
    }
  });

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  const today = new Date().toISOString().split('T')[0] as string;

  // Check if today or yesterday is in the list
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0] as string;

  if (!sortedDays.includes(today) && !sortedDays.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date();

  // Start from today or yesterday
  if (!sortedDays.includes(today)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (sortedDays.includes(currentDate.toISOString().split('T')[0] as string)) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all breathworks for admin (including unpublished)
 */
export async function getAdminBreathworks(filters: BreathworkFilters) {
  const { page, limit, sortBy, sortOrder, search } = filters;
  const skip = (page - 1) * limit;

  // Map sortBy to actual field names
  const sortFieldMap: Record<string, string> = {
    'durationSeconds': 'totalDuration',
    'createdAt': 'createdAt',
    'title': 'title',
    'playCount': 'playCount',
  };
  const actualSortBy = sortFieldMap[sortBy] || 'createdAt';

  const where: Prisma.breathworksWhereInput = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [breathworks, total] = await Promise.all([
    prisma.breathworks.findMany({
      where,
      orderBy: { [actualSortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    }),
    prisma.breathworks.count({ where }),
  ]);

  return {
    breathworks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new breathwork (admin)
 */
export async function createBreathwork(input: CreateBreathworkInput) {
  return prisma.breathworks.create({
    data: {
      slug: input.slug,
      title: input.title,
      titleEn: input.titleEn,
      description: input.description,
      descriptionEn: input.descriptionEn,
      category: input.category as BreathworkCategory,
      pattern: input.pattern as BreathworkPattern,
      animationType: (input.animation || 'CIRCLE') as BreathworkAnimation,
      totalDuration: input.durationSeconds,
      inhale: input.inhaleSeconds,
      hold1: input.holdInSeconds || 0,
      exhale: input.exhaleSeconds,
      hold2: input.holdOutSeconds || 0,
      cycles: input.cycles || 4,
      coverImage: input.imageUrl,
      audioUrl: input.audioUrl,
      isPremium: input.isPremium || false,
      isFeatured: input.isFeatured || false,
      isPublished: true,
      benefits: input.benefits || [],
    },
  });
}

/**
 * Update a breathwork (admin)
 */
export async function updateBreathwork(id: string, input: UpdateBreathworkInput) {
  const data: Prisma.breathworksUpdateInput = {};

  if (input.slug) data.slug = input.slug;
  if (input.title) data.title = input.title;
  if (input.titleEn) data.titleEn = input.titleEn;
  if (input.description) data.description = input.description;
  if (input.descriptionEn) data.descriptionEn = input.descriptionEn;
  if (input.category) data.category = input.category as BreathworkCategory;
  if (input.pattern) data.pattern = input.pattern as BreathworkPattern;
  if (input.animation) data.animationType = input.animation as BreathworkAnimation;
  if (input.durationSeconds) data.totalDuration = input.durationSeconds;
  if (input.inhaleSeconds) data.inhale = input.inhaleSeconds;
  if (input.holdInSeconds !== undefined) data.hold1 = input.holdInSeconds;
  if (input.exhaleSeconds) data.exhale = input.exhaleSeconds;
  if (input.holdOutSeconds !== undefined) data.hold2 = input.holdOutSeconds;
  if (input.cycles) data.cycles = input.cycles;
  if (input.imageUrl) data.coverImage = input.imageUrl;
  if (input.audioUrl) data.audioUrl = input.audioUrl;
  if (input.isPremium !== undefined) data.isPremium = input.isPremium;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.isFree !== undefined) data.isPremium = !input.isFree;
  if (input.benefits) data.benefits = input.benefits;

  return prisma.breathworks.update({
    where: { id },
    data,
  });
}

/**
 * Delete a breathwork (soft delete)
 */
export async function deleteBreathwork(id: string) {
  return prisma.breathworks.update({
    where: { id },
    data: { isPublished: false },
  });
}

/**
 * Get breathwork statistics
 */
export async function getBreathworkStats() {
  const [totalBreathworks, totalSessions, totalPracticeTime, categoryStats] = await Promise.all([
    prisma.breathworks.count({ where: { isPublished: true } }),
    prisma.breathwork_sessions.count({ where: { completed: true } }),
    prisma.breathwork_sessions.aggregate({
      where: { completed: true },
      _sum: { duration: true },
    }),
    Promise.all(
      Object.values(BreathworkCategory).map(async (category) => {
        const count = await prisma.breathworks.count({
          where: { category, isPublished: true },
        });
        return { category, count };
      })
    ),
  ]);

  return {
    totalBreathworks,
    totalSessions,
    totalPracticeMinutes: Math.floor((totalPracticeTime._sum.duration || 0) / 60),
    categoryStats,
  };
}
