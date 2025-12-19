import { prisma } from '../utils/database';
import type { SleepStoryCategory } from '@prisma/client';
import type {
  SleepStoryFilters,
  UpdateProgressInput,
  RateStoryInput,
  CreateSleepStoryInput,
  UpdateSleepStoryInput,
  SleepTimerSettingsInput,
} from '../validation/sleepStorySchemas';

// ==================== SLEEP STORIES ====================

export async function getSleepStories(filters: SleepStoryFilters) {
  const { category, isPremium, isFeatured, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {
    isPublished: true,
  };

  if (category) where.category = category;
  if (isPremium !== undefined) where.isPremium = isPremium;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  const [stories, total] = await Promise.all([
    prisma.sleep_stories.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        backgroundSound: true,
      },
    }),
    prisma.sleep_stories.count({ where }),
  ]);

  return {
    stories,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getFeaturedStories(limit: number = 10) {
  return prisma.sleep_stories.findMany({
    where: { isPublished: true, isFeatured: true },
    take: limit,
    orderBy: { playCount: 'desc' },
    include: {
      backgroundSound: true,
    },
  });
}

export async function getStoriesByCategory(category: SleepStoryCategory, limit: number = 20) {
  return prisma.sleep_stories.findMany({
    where: { category, isPublished: true },
    take: limit,
    orderBy: { playCount: 'desc' },
    include: {
      backgroundSound: true,
    },
  });
}

export async function getCategories() {
  const categories = await prisma.sleep_stories.groupBy({
    by: ['category'],
    where: { isPublished: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  return categories.map((c: { category: SleepStoryCategory; _count: { category: number } }) => ({
    category: c.category,
    count: c._count.category,
  }));
}

export async function getSleepStory(id: string, userId?: string) {
  const story = await prisma.sleep_stories.findUnique({
    where: { id, isPublished: true },
    include: {
      backgroundSound: true,
    },
  });

  if (!story) return null;

  let progress = null;
  if (userId) {
    progress = await prisma.sleep_story_progress.findUnique({
      where: { storyId_userId: { storyId: id, userId } },
    });
  }

  return { ...story, progress };
}

// ==================== PLAYBACK ====================

export async function startStory(userId: string, storyId: string) {
  const story = await prisma.sleep_stories.findUnique({
    where: { id: storyId, isPublished: true },
  });

  if (!story) {
    throw new Error('Story not found');
  }

  // Increment play count
  await prisma.sleep_stories.update({
    where: { id: storyId },
    data: { playCount: { increment: 1 } },
  });

  // Create or update progress
  const progress = await prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId, userId } },
    update: {
      playCount: { increment: 1 },
      lastPlayedAt: new Date(),
    },
    create: {
      storyId,
      userId,
      currentTime: 0,
      duration: story.duration,
      completed: false,
      playCount: 1,
    },
  });

  return progress;
}

export async function updateProgress(userId: string, storyId: string, input: UpdateProgressInput) {
  const { currentTime, duration } = input;
  const completed = (currentTime / duration) * 100 >= 95;

  return prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId, userId } },
    update: {
      currentTime,
      duration,
      completed,
      completedAt: completed ? new Date() : undefined,
      lastPlayedAt: new Date(),
    },
    create: {
      storyId,
      userId,
      currentTime,
      duration,
      completed,
      completedAt: completed ? new Date() : undefined,
    },
  });
}

export async function completeStory(userId: string, storyId: string) {
  const story = await prisma.sleep_stories.findUnique({
    where: { id: storyId },
  });

  if (!story) {
    throw new Error('Story not found');
  }

  return prisma.sleep_story_progress.upsert({
    where: { storyId_userId: { storyId, userId } },
    update: {
      currentTime: story.duration,
      completed: true,
      completedAt: new Date(),
      lastPlayedAt: new Date(),
    },
    create: {
      storyId,
      userId,
      currentTime: story.duration,
      duration: story.duration,
      completed: true,
      completedAt: new Date(),
    },
  });
}

// ==================== RATINGS ====================

export async function rateStory(userId: string, storyId: string, input: RateStoryInput) {
  const { rating, review } = input;

  // Create or update rating
  const storyRating = await prisma.sleep_story_ratings.upsert({
    where: { storyId_userId: { storyId, userId } },
    update: { rating, review },
    create: { storyId, userId, rating, review },
  });

  // Recalculate average rating
  const ratings = await prisma.sleep_story_ratings.aggregate({
    where: { storyId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.sleep_stories.update({
    where: { id: storyId },
    data: {
      averageRating: ratings._avg.rating ?? 0,
      ratingCount: ratings._count.rating,
    },
  });

  return storyRating;
}

export async function getStoryRatings(storyId: string, page: number = 1, limit: number = 20) {
  const [ratings, total] = await Promise.all([
    prisma.sleep_story_ratings.findMany({
      where: { storyId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    }),
    prisma.sleep_story_ratings.count({ where: { storyId } }),
  ]);

  return {
    ratings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== USER DATA ====================

export async function getListeningHistory(userId: string, page: number = 1, limit: number = 20) {
  const [progress, total] = await Promise.all([
    prisma.sleep_story_progress.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { lastPlayedAt: 'desc' },
      include: {
        story: {
          include: { backgroundSound: true },
        },
      },
    }),
    prisma.sleep_story_progress.count({ where: { userId } }),
  ]);

  return {
    history: progress.map((p: any) => ({
      ...p.story,
      progress: {
        currentTime: p.currentTime,
        duration: p.duration,
        completed: p.completed,
        lastPlayedAt: p.lastPlayedAt,
      },
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getContinueWatching(userId: string, limit: number = 5) {
  const progress = await prisma.sleep_story_progress.findMany({
    where: {
      userId,
      completed: false,
      currentTime: { gt: 0 },
    },
    take: limit,
    orderBy: { lastPlayedAt: 'desc' },
    include: {
      story: {
        include: { backgroundSound: true },
      },
    },
  });

  return progress.map((p: any) => ({
    ...p.story,
    progress: {
      currentTime: p.currentTime,
      duration: p.duration,
      lastPlayedAt: p.lastPlayedAt,
    },
  }));
}

// ==================== SLEEP TIMER SETTINGS ====================

export async function getSleepTimerSettings(userId: string) {
  return prisma.sleep_timer_settings.findUnique({
    where: { userId },
    include: { defaultSound: true },
  });
}

export async function updateSleepTimerSettings(userId: string, input: SleepTimerSettingsInput) {
  return prisma.sleep_timer_settings.upsert({
    where: { userId },
    update: input,
    create: {
      userId,
      ...input,
    },
    include: { defaultSound: true },
  });
}

// ==================== ADMIN SERVICES ====================

export async function getAdminSleepStories(filters: SleepStoryFilters) {
  const { category, isPremium, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {};

  if (category) where.category = category;
  if (isPremium !== undefined) where.isPremium = isPremium;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [stories, total] = await Promise.all([
    prisma.sleep_stories.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        backgroundSound: true,
      },
    }),
    prisma.sleep_stories.count({ where }),
  ]);

  return {
    stories,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createSleepStory(input: CreateSleepStoryInput) {
  return prisma.sleep_stories.create({
    data: {
      ...input,
      category: input.category as SleepStoryCategory,
    },
    include: { backgroundSound: true },
  });
}

export async function updateSleepStory(id: string, input: UpdateSleepStoryInput) {
  const updateData: any = { ...input };
  if (input.category) {
    updateData.category = input.category as any;
  }

  return prisma.sleep_stories.update({
    where: { id },
    data: updateData,
    include: { backgroundSound: true },
  });
}

export async function deleteSleepStory(id: string) {
  return prisma.sleep_stories.delete({
    where: { id },
  });
}

export async function getSleepStoryStats() {
  const [total, byCategory, totalPlays] = await Promise.all([
    prisma.sleep_stories.count(),
    prisma.sleep_stories.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
    prisma.sleep_stories.aggregate({
      _sum: { playCount: true },
    }),
  ]);

  return {
    total,
    byCategory: byCategory.map((c: { category: SleepStoryCategory; _count: { category: number } }) => ({
      category: c.category,
      count: c._count.category,
    })),
    totalPlays: totalPlays._sum.playCount || 0,
  };
}
