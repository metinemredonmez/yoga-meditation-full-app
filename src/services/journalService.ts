import { prisma } from '../utils/database';
import type { JournalType } from '@prisma/client';
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  JournalFilters,
  JournalCalendarQuery,
  JournalStatsQuery,
  JournalSearchQuery,
  CreateJournalPromptInput,
  UpdateJournalPromptInput,
  PromptFilters,
} from '../validation/journalSchemas';

// ==================== JOURNAL ENTRIES ====================

export async function getJournalEntries(userId: string, filters: JournalFilters) {
  const { type, startDate, endDate, mood, tags, isFavorite, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = { userId };

  if (type) where.type = type;
  if (mood) where.mood = mood;
  if (isFavorite !== undefined) where.isFavorite = isFavorite;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim());
    where.tags = { hasSome: tagList };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.journal_entries.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        prompt: true,
      },
    }),
    prisma.journal_entries.count({ where }),
  ]);

  return {
    entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getJournalEntry(userId: string, id: string) {
  return prisma.journal_entries.findFirst({
    where: { id, userId },
    include: { prompt: true },
  });
}

export async function createJournalEntry(userId: string, input: CreateJournalEntryInput) {
  const date = input.date ? new Date(input.date) : new Date();
  date.setHours(0, 0, 0, 0);

  const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;

  // Increment prompt use count if promptId provided
  if (input.promptId) {
    await prisma.journal_prompts.update({
      where: { id: input.promptId },
      data: { useCount: { increment: 1 } },
    });
  }

  return prisma.journal_entries.create({
    data: {
      userId,
      title: input.title,
      content: input.content,
      type: input.type as JournalType,
      promptId: input.promptId,
      mood: input.mood as any,
      tags: input.tags,
      images: input.images,
      audioUrl: input.audioUrl,
      isPrivate: input.isPrivate,
      wordCount,
      date,
    },
    include: { prompt: true },
  });
}

export async function updateJournalEntry(userId: string, id: string, input: UpdateJournalEntryInput) {
  const existing = await prisma.journal_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Journal entry not found');
  }

  const wordCount = input.content
    ? input.content.trim().split(/\s+/).filter(Boolean).length
    : existing.wordCount;

  return prisma.journal_entries.update({
    where: { id },
    data: {
      ...input,
      type: input.type as JournalType | undefined,
      mood: input.mood as any,
      wordCount,
    },
    include: { prompt: true },
  });
}

export async function deleteJournalEntry(userId: string, id: string) {
  const existing = await prisma.journal_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Journal entry not found');
  }

  return prisma.journal_entries.delete({
    where: { id },
  });
}

export async function toggleFavorite(userId: string, id: string) {
  const existing = await prisma.journal_entries.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Journal entry not found');
  }

  return prisma.journal_entries.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });
}

export async function getFavoriteEntries(userId: string, page: number = 1, limit: number = 20) {
  const [entries, total] = await Promise.all([
    prisma.journal_entries.findMany({
      where: { userId, isFavorite: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: { prompt: true },
    }),
    prisma.journal_entries.count({ where: { userId, isFavorite: true } }),
  ]);

  return {
    entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== CALENDAR ====================

export async function getCalendar(userId: string, query: JournalCalendarQuery) {
  const { year, month } = query;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const entries = await prisma.journal_entries.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      date: true,
      type: true,
      mood: true,
      wordCount: true,
    },
    orderBy: { date: 'asc' },
  });

  // Group by day
  const days: Record<string, any[]> = {};
  entries.forEach((entry) => {
    const day = entry.date.toISOString().split('T')[0]!;
    if (!days[day]) days[day] = [];
    days[day]!.push(entry);
  });

  return { year, month, days };
}

// ==================== STATS ====================

export async function getStats(userId: string, query: JournalStatsQuery) {
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
        dateFrom = new Date(2020, 0, 1);
        break;
    }
  }

  const entries = await prisma.journal_entries.findMany({
    where: {
      userId,
      date: { gte: dateFrom, lte: dateTo },
    },
    orderBy: { date: 'asc' },
  });

  const totalEntries = entries.length;
  const totalWords = entries.reduce((acc, e) => acc + e.wordCount, 0);
  const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  // Type distribution
  const typeDistribution: Record<string, number> = {};
  entries.forEach((e) => {
    typeDistribution[e.type] = (typeDistribution[e.type] || 0) + 1;
  });

  // Mood distribution
  const moodDistribution: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
    }
  });

  // Calculate streak
  const streak = await calculateStreak(userId);

  return {
    period,
    dateFrom,
    dateTo,
    totalEntries,
    totalWords,
    avgWords,
    typeDistribution,
    moodDistribution,
    streak,
  };
}

async function calculateStreak(userId: string): Promise<number> {
  const entries = await prisma.journal_entries.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
    distinct: ['date'],
  });

  if (entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i]!.date);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ==================== SEARCH ====================

export async function searchEntries(userId: string, query: JournalSearchQuery) {
  const { query: searchQuery, page, limit } = query;

  const where: any = {
    userId,
    OR: [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { content: { contains: searchQuery, mode: 'insensitive' } },
      { tags: { has: searchQuery.toLowerCase() } },
    ],
  };

  const [entries, total] = await Promise.all([
    prisma.journal_entries.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: { prompt: true },
    }),
    prisma.journal_entries.count({ where }),
  ]);

  return {
    entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== PROMPTS ====================

export async function getPrompts(filters: PromptFilters) {
  const { type, category, isActive, page, limit } = filters;

  const where: any = {};
  if (type) where.type = type;
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive;

  const [prompts, total] = await Promise.all([
    prisma.journal_prompts.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.journal_prompts.count({ where }),
  ]);

  return {
    prompts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDailyPrompts(type?: JournalType) {
  const where: any = { isActive: true };
  if (type) where.type = type;

  return prisma.journal_prompts.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }],
    take: 5,
  });
}

export async function getRandomPrompt(type?: JournalType) {
  const where: any = { isActive: true };
  if (type) where.type = type;

  const count = await prisma.journal_prompts.count({ where });
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);

  const prompts = await prisma.journal_prompts.findMany({
    where,
    skip,
    take: 1,
  });

  return prompts[0] || null;
}

// ==================== ADMIN PROMPTS ====================

export async function createPrompt(input: CreateJournalPromptInput) {
  return prisma.journal_prompts.create({
    data: {
      ...input,
      type: input.type as JournalType,
    },
  });
}

export async function updatePrompt(id: string, input: UpdateJournalPromptInput) {
  return prisma.journal_prompts.update({
    where: { id },
    data: {
      ...input,
      type: input.type as JournalType | undefined,
    },
  });
}

export async function deletePrompt(id: string) {
  return prisma.journal_prompts.delete({
    where: { id },
  });
}

export async function getAdminPrompts(filters: PromptFilters) {
  const { type, category, isActive, page, limit } = filters;

  const where: any = {};
  if (type) where.type = type;
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive;

  const [prompts, total] = await Promise.all([
    prisma.journal_prompts.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.journal_prompts.count({ where }),
  ]);

  return {
    prompts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
