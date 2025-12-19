import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type {
  MeditationFilters,
  UpdateProgressInput,
  CompleteSessionInput,
  RatingInput,
  CreateMeditationInput,
  UpdateMeditationInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../validation/meditationSchemas';
import { MeditationDifficulty, Prisma } from '@prisma/client';

// ==================== USER ENDPOINTS ====================

/**
 * Get list of meditations with filters and pagination
 */
export async function getMeditations(filters: MeditationFilters) {
  const {
    categoryId,
    instructorId,
    difficulty,
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

  const where: Prisma.meditationsWhereInput = {
    isPublished: true,
    ...(categoryId && { categoryId }),
    ...(instructorId && { instructorId }),
    ...(difficulty && { difficulty: difficulty as MeditationDifficulty }),
    ...(isFree !== undefined && { isPremium: !isFree }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(minDuration && { duration: { gte: minDuration } }),
    ...(maxDuration && { duration: { lte: maxDuration } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const orderBy: Prisma.meditationsOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [meditations, total] = await Promise.all([
    prisma.meditations.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            icon: true,
          },
        },
        instructor: {
          select: {
            id: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
    }),
    prisma.meditations.count({ where }),
  ]);

  return {
    meditations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get featured meditations
 */
export async function getFeaturedMeditations(limit: number = 10) {
  return prisma.meditations.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          icon: true,
        },
      },
      instructor: {
        select: {
          id: true,
          displayName: true,
          profileImageUrl: true,
        },
      },
    },
  });
}

/**
 * Get all meditation categories
 */
export async function getCategories() {
  return prisma.meditation_categories.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          meditations: {
            where: { isPublished: true },
          },
        },
      },
    },
  });
}

/**
 * Search meditations with full-text search
 */
export async function searchMeditations(query: string, limit: number = 20) {
  return prisma.meditations.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { titleEn: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    },
    orderBy: { playCount: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

/**
 * Get personalized meditations for user based on preferences and history
 */
export async function getForYouMeditations(userId: string, limit: number = 10) {
  // Get user's completed meditations and preferences
  const [completedSessions, favorites, onboarding] = await Promise.all([
    prisma.meditation_sessions.findMany({
      where: { userId, completedAt: { not: null } },
      select: { meditation: { select: { categoryId: true, difficulty: true } } },
      orderBy: { endedAt: 'desc' },
      take: 50,
    }),
    prisma.meditation_favorites.findMany({
      where: { userId },
      select: { meditation: { select: { categoryId: true, difficulty: true } } },
    }),
    prisma.user_onboarding.findUnique({
      where: { userId },
      select: { experienceLevel: true, goals: true },
    }),
  ]);

  // Analyze user preferences
  const preferredCategories = new Set<string>();
  const preferredDifficulties = new Set<MeditationDifficulty>();

  completedSessions.forEach((s) => {
    if (s.meditation) {
      if (s.meditation.categoryId) preferredCategories.add(s.meditation.categoryId);
      if (s.meditation.difficulty) preferredDifficulties.add(s.meditation.difficulty);
    }
  });

  favorites.forEach((f) => {
    if (f.meditation) {
      if (f.meditation.categoryId) preferredCategories.add(f.meditation.categoryId);
      if (f.meditation.difficulty) preferredDifficulties.add(f.meditation.difficulty);
    }
  });

  // Add onboarding preferences - experienceLevel maps to difficulty
  if (onboarding?.experienceLevel) {
    // Map experience level to meditation difficulty
    const levelToDifficulty: Record<string, MeditationDifficulty> = {
      'BEGINNER': MeditationDifficulty.BEGINNER,
      'INTERMEDIATE': MeditationDifficulty.INTERMEDIATE,
      'ADVANCED': MeditationDifficulty.ADVANCED,
    };
    const difficulty = levelToDifficulty[onboarding.experienceLevel];
    if (difficulty) preferredDifficulties.add(difficulty);
  }

  // Build query based on preferences
  const where: Prisma.meditationsWhereInput = {
    isPublished: true,
    ...(preferredCategories.size > 0 && {
      categoryId: { in: Array.from(preferredCategories) },
    }),
    ...(preferredDifficulties.size > 0 && {
      difficulty: { in: Array.from(preferredDifficulties) },
    }),
  };

  // Get recommendations excluding already completed
  const completedIds = await prisma.meditation_sessions.findMany({
    where: { userId, completedAt: { not: null } },
    select: { meditationId: true },
    distinct: ['meditationId'],
  });

  const completedMeditationIds = completedIds.map((c) => c.meditationId).filter((id): id is string => id !== null);

  return prisma.meditations.findMany({
    where: {
      ...where,
      id: { notIn: completedMeditationIds },
    },
    orderBy: [{ isFeatured: 'desc' }, { playCount: 'desc' }],
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          icon: true,
        },
      },
      instructor: {
        select: {
          id: true,
          displayName: true,
          profileImageUrl: true,
        },
      },
    },
  });
}

/**
 * Get single meditation detail
 */
export async function getMeditation(id: string, userId?: string) {
  const meditation = await prisma.meditations.findUnique({
    where: { id, isPublished: true },
    include: {
      category: true,
      instructor: {
        select: {
          id: true,
          displayName: true,
          profileImageUrl: true,
          bio: true,
        },
      },
      _count: {
        select: {
          ratings: true,
          favorites: true,
        },
      },
    },
  });

  if (!meditation) return null;

  // Get user-specific data if authenticated
  let userProgress = null;
  let userRating = null;
  let isFavorite = false;

  if (userId) {
    const [progress, rating, favorite] = await Promise.all([
      prisma.meditation_progress.findUnique({
        where: { meditationId_userId: { meditationId: id, userId } },
      }),
      prisma.meditation_ratings.findUnique({
        where: { meditationId_userId: { meditationId: id, userId } },
      }),
      prisma.meditation_favorites.findUnique({
        where: { meditationId_userId: { meditationId: id, userId } },
      }),
    ]);

    userProgress = progress;
    userRating = rating;
    isFavorite = !!favorite;
  }

  return {
    ...meditation,
    userProgress,
    userRating,
    isFavorite,
  };
}

/**
 * Get related meditations
 */
export async function getRelatedMeditations(meditationId: string, limit: number = 6) {
  const meditation = await prisma.meditations.findUnique({
    where: { id: meditationId },
    select: { categoryId: true, difficulty: true, tags: true },
  });

  if (!meditation) return [];

  return prisma.meditations.findMany({
    where: {
      id: { not: meditationId },
      isPublished: true,
      OR: [
        { categoryId: meditation.categoryId },
        { difficulty: meditation.difficulty },
        { tags: { hasSome: meditation.tags } },
      ],
    },
    orderBy: { playCount: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
        },
      },
    },
  });
}

/**
 * Start a meditation session
 */
export async function startSession(userId: string, meditationId: string) {
  // Check if meditation exists
  const meditation = await prisma.meditations.findUnique({
    where: { id: meditationId, isPublished: true },
  });

  if (!meditation) {
    throw new Error('Meditation not found');
  }

  // Create or get progress record
  const progress = await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId, userId } },
    create: {
      meditationId,
      userId,
      currentTime: 0,
      duration: meditation.duration,
      percentage: 0,
      completed: false,
    },
    update: {
      lastPlayedAt: new Date(),
    },
  });

  // Create session record
  const session = await prisma.meditation_sessions.create({
    data: {
      meditationId,
      userId,
      targetDuration: meditation.duration,
      type: 'GUIDED',
      startedAt: new Date(),
    },
  });

  // Increment play count
  await prisma.meditations.update({
    where: { id: meditationId },
    data: { playCount: { increment: 1 } },
  });

  return { session, progress };
}

/**
 * Update meditation progress
 */
export async function updateProgress(
  userId: string,
  meditationId: string,
  input: UpdateProgressInput
) {
  const { progressSeconds, completed } = input;

  // Get meditation duration to calculate percentage
  const meditation = await prisma.meditations.findUnique({
    where: { id: meditationId },
    select: { duration: true },
  });

  const duration = meditation?.duration || 0;
  const percentage = duration > 0 ? (progressSeconds / duration) * 100 : 0;

  return prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId, userId } },
    create: {
      meditationId,
      userId,
      currentTime: progressSeconds,
      duration,
      percentage: Math.min(percentage, 100),
      completed: completed || false,
      lastPlayedAt: new Date(),
    },
    update: {
      currentTime: progressSeconds,
      percentage: Math.min(percentage, 100),
      totalListened: { increment: progressSeconds },
      ...(completed && { completed, completedAt: new Date(), playCount: { increment: 1 } }),
      lastPlayedAt: new Date(),
    },
  });
}

/**
 * Complete a meditation session
 */
export async function completeSession(
  userId: string,
  meditationId: string,
  sessionId: string,
  input: CompleteSessionInput
) {
  const { listenedSeconds } = input;

  // Get the meditation to calculate XP
  const meditation = await prisma.meditations.findUnique({
    where: { id: meditationId },
    select: { duration: true },
  });

  if (!meditation) {
    throw new Error('Meditation not found');
  }

  // Update session
  const session = await prisma.meditation_sessions.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      actualDuration: listenedSeconds,
      completedAt: new Date(),
      status: 'COMPLETED',
    },
  });

  // Update progress
  const progress = await prisma.meditation_progress.upsert({
    where: { meditationId_userId: { meditationId, userId } },
    create: {
      meditationId,
      userId,
      currentTime: meditation.duration,
      duration: meditation.duration,
      percentage: 100,
      completed: true,
      completedAt: new Date(),
      playCount: 1,
      totalListened: listenedSeconds,
    },
    update: {
      currentTime: meditation.duration,
      percentage: 100,
      completed: true,
      completedAt: new Date(),
      playCount: { increment: 1 },
      totalListened: { increment: listenedSeconds },
    },
  });

  // Calculate XP earned (10 XP per minute listened)
  // Note: XP tracking can be added through gamification_points table if needed
  const xpEarned = Math.floor(listenedSeconds / 60) * 10;

  return { session, progress, xpEarned };
}

/**
 * Rate a meditation
 */
export async function rateMeditation(
  userId: string,
  meditationId: string,
  input: RatingInput
) {
  const { rating, review } = input;

  const result = await prisma.meditation_ratings.upsert({
    where: { meditationId_userId: { meditationId, userId } },
    create: {
      meditationId,
      userId,
      rating,
      review,
    },
    update: {
      rating,
      review,
      updatedAt: new Date(),
    },
  });

  // Update average rating on meditation
  const avgResult = await prisma.meditation_ratings.aggregate({
    where: { meditationId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.meditations.update({
    where: { id: meditationId },
    data: {
      averageRating: avgResult._avg.rating || 0,
      ratingCount: avgResult._count.rating,
    },
  });

  return result;
}

/**
 * Get ratings for a meditation
 */
export async function getMeditationRatings(meditationId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [ratings, total] = await Promise.all([
    prisma.meditation_ratings.findMany({
      where: { meditationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.meditation_ratings.count({ where: { meditationId } }),
  ]);

  return {
    ratings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Add meditation to favorites
 */
export async function addToFavorites(userId: string, meditationId: string) {
  return prisma.meditation_favorites.create({
    data: {
      meditationId,
      userId,
    },
  });
}

/**
 * Remove meditation from favorites
 */
export async function removeFromFavorites(userId: string, meditationId: string) {
  return prisma.meditation_favorites.delete({
    where: { meditationId_userId: { meditationId, userId } },
  });
}

/**
 * Get user's favorite meditations
 */
export async function getFavorites(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    prisma.meditation_favorites.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        meditation: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                icon: true,
              },
            },
            instructor: {
              select: {
                id: true,
                displayName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.meditation_favorites.count({ where: { userId } }),
  ]);

  return {
    favorites: favorites.map((f) => f.meditation),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user's listening history
 */
export async function getHistory(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.meditation_sessions.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
      include: {
        meditation: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.meditation_sessions.count({ where: { userId } }),
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
 * Get meditations in progress (not completed)
 */
export async function getContinueMeditations(userId: string, limit: number = 10) {
  const inProgress = await prisma.meditation_progress.findMany({
    where: {
      userId,
      completed: false,
      currentTime: { gt: 0 },
    },
    orderBy: { lastPlayedAt: 'desc' },
    take: limit,
    include: {
      meditation: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              slug: true,
              icon: true,
            },
          },
        },
      },
    },
  });

  return inProgress.map((p) => ({
    ...p.meditation,
    currentTime: p.currentTime,
    percentage: p.percentage,
    lastPlayedAt: p.lastPlayedAt,
  }));
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all meditations for admin (including inactive)
 */
export async function getAdminMeditations(filters: MeditationFilters) {
  const { page, limit, sortBy, sortOrder, search } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.meditationsWhereInput = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [meditations, total] = await Promise.all([
    prisma.meditations.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, nameEn: true },
        },
        instructor: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: {
            sessions: true,
            favorites: true,
            ratings: true,
          },
        },
      },
    }),
    prisma.meditations.count({ where }),
  ]);

  return {
    meditations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new meditation (admin)
 */
export async function createMeditation(input: CreateMeditationInput) {
  return prisma.meditations.create({
    data: {
      ...input,
      difficulty: input.difficulty as MeditationDifficulty,
    },
    include: {
      category: true,
      instructor: {
        select: { id: true, displayName: true },
      },
    },
  });
}

/**
 * Update a meditation (admin)
 */
export async function updateMeditation(id: string, input: UpdateMeditationInput) {
  return prisma.meditations.update({
    where: { id },
    data: {
      ...input,
      ...(input.difficulty && { difficulty: input.difficulty as MeditationDifficulty }),
    },
    include: {
      category: true,
      instructor: {
        select: { id: true, displayName: true },
      },
    },
  });
}

/**
 * Delete a meditation (soft delete - set inactive)
 */
export async function deleteMeditation(id: string) {
  return prisma.meditations.update({
    where: { id },
    data: { isPublished: false },
  });
}

/**
 * Get all categories for admin
 */
export async function getAdminCategories() {
  return prisma.meditation_categories.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { meditations: true },
      },
    },
  });
}

/**
 * Create a category (admin)
 */
export async function createCategory(input: CreateCategoryInput) {
  return prisma.meditation_categories.create({
    data: input,
  });
}

/**
 * Update a category (admin)
 */
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  return prisma.meditation_categories.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a category (soft delete)
 */
export async function deleteCategory(id: string) {
  // Check if category has meditations
  const count = await prisma.meditations.count({
    where: { categoryId: id, isPublished: true },
  });

  if (count > 0) {
    throw new Error('Cannot delete category with active meditations');
  }

  return prisma.meditation_categories.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Get meditation statistics
 */
export async function getMeditationStats() {
  const [totalMeditations, totalSessions, totalListenTime, categoryStats] = await Promise.all([
    prisma.meditations.count({ where: { isPublished: true } }),
    prisma.meditation_sessions.count({ where: { completedAt: { not: null } } }),
    prisma.meditation_sessions.aggregate({
      where: { completedAt: { not: null } },
      _sum: { actualDuration: true },
    }),
    prisma.meditation_categories.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            meditations: { where: { isPublished: true } },
          },
        },
      },
    }),
  ]);

  return {
    totalMeditations,
    totalSessions,
    totalListenTimeMinutes: Math.floor((totalListenTime._sum.actualDuration || 0) / 60),
    categoryStats,
  };
}
