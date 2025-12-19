import { prisma } from '../utils/database';
import type {
  QuoteFilters,
  CreateQuoteInput,
  UpdateQuoteInput,
  CreateDailyContentInput,
  UpdateDailyContentInput,
} from '../validation/dailyContentSchemas';

// ==================== DAILY CONTENT ====================

export async function getTodayContent() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const content = await prisma.daily_content.findUnique({
    where: { date: today },
    include: {
      quote: true,
      meditation: {
        include: {
          category: true,
          instructor: {
            select: { id: true, userId: true },
          },
        },
      },
      breathwork: true,
    },
  });

  // If no content for today, get random featured content
  if (!content) {
    const [randomQuote, randomMeditation, randomBreathwork] = await Promise.all([
      prisma.daily_quotes.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.meditations.findFirst({
        where: { isPublished: true, isFeatured: true },
        include: {
          category: true,
          instructor: {
            select: { id: true, userId: true },
          },
        },
        orderBy: { playCount: 'desc' },
      }),
      prisma.breathworks.findFirst({
        where: { isPublished: true, isFeatured: true },
        orderBy: { playCount: 'desc' },
      }),
    ]);

    return {
      date: today,
      quote: randomQuote,
      meditation: randomMeditation,
      breathwork: randomBreathwork,
      tip: null,
      challenge: null,
    };
  }

  return content;
}

export async function getDailyContent(date: Date) {
  return prisma.daily_content.findUnique({
    where: { date },
    include: {
      quote: true,
      meditation: {
        include: {
          category: true,
          instructor: {
            select: { id: true, userId: true },
          },
        },
      },
      breathwork: true,
    },
  });
}

// ==================== QUOTES ====================

export async function getTodayQuote() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for scheduled quote
  let quote = await prisma.daily_quotes.findFirst({
    where: {
      scheduledDate: today,
      isActive: true,
    },
  });

  if (!quote) {
    // Get random active quote
    const count = await prisma.daily_quotes.count({ where: { isActive: true } });
    const skip = Math.floor(Math.random() * count);
    quote = await prisma.daily_quotes.findFirst({
      where: { isActive: true },
      skip,
    });
  }

  return quote;
}

export async function getQuotes(filters: QuoteFilters) {
  const { category, language, isActive, page, limit } = filters;

  const where: any = {};
  if (category) where.category = category;
  if (language) where.language = language;
  if (isActive !== undefined) where.isActive = isActive;

  const [quotes, total] = await Promise.all([
    prisma.daily_quotes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.daily_quotes.count({ where }),
  ]);

  return {
    quotes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getQuote(id: string) {
  return prisma.daily_quotes.findUnique({
    where: { id },
  });
}

export async function getRandomQuote(category?: string) {
  const where: any = { isActive: true };
  if (category) where.category = category;

  const count = await prisma.daily_quotes.count({ where });
  const skip = Math.floor(Math.random() * count);

  return prisma.daily_quotes.findFirst({
    where,
    skip,
  });
}

// ==================== ADMIN SERVICES ====================

export async function createQuote(input: CreateQuoteInput) {
  return prisma.daily_quotes.create({
    data: {
      ...input,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
    },
  });
}

export async function updateQuote(id: string, input: UpdateQuoteInput) {
  return prisma.daily_quotes.update({
    where: { id },
    data: {
      ...input,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
    },
  });
}

export async function deleteQuote(id: string) {
  return prisma.daily_quotes.delete({
    where: { id },
  });
}

export async function getAdminDailyContent(page: number = 1, limit: number = 20) {
  const [content, total] = await Promise.all([
    prisma.daily_content.findMany({
      include: {
        quote: true,
        meditation: true,
        breathwork: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.daily_content.count(),
  ]);

  return {
    content,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createDailyContent(input: CreateDailyContentInput) {
  const date = new Date(input.date);
  date.setHours(0, 0, 0, 0);

  return prisma.daily_content.create({
    data: {
      date,
      quoteId: input.quoteId,
      meditationId: input.meditationId,
      breathworkId: input.breathworkId,
      tip: input.tip,
      challenge: input.challenge,
      isPublished: input.isPublished,
    },
    include: {
      quote: true,
      meditation: true,
      breathwork: true,
    },
  });
}

export async function updateDailyContent(id: string, input: UpdateDailyContentInput) {
  return prisma.daily_content.update({
    where: { id },
    data: input,
    include: {
      quote: true,
      meditation: true,
      breathwork: true,
    },
  });
}

export async function deleteDailyContent(id: string) {
  return prisma.daily_content.delete({
    where: { id },
  });
}

export async function getDailyContentStats() {
  const [totalQuotes, totalContent, scheduledContent] = await Promise.all([
    prisma.daily_quotes.count({ where: { isActive: true } }),
    prisma.daily_content.count(),
    prisma.daily_content.count({
      where: {
        date: { gte: new Date() },
      },
    }),
  ]);

  return {
    totalQuotes,
    totalContent,
    scheduledContent,
  };
}
