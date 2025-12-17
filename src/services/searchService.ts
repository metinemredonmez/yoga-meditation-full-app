import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { getRedisClient } from '../utils/redis';

// ============================================
// Types
// ============================================

interface SearchResult {
  type: 'program' | 'class' | 'pose' | 'instructor' | 'podcast' | 'challenge';
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>;
  score: number;
}

interface SearchFilters {
  type?: string | string[];
  level?: string;
  duration?: { min?: number; max?: number };
  category?: string;
  instructorId?: string;
  tags?: string[];
}

interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  userId?: string; // For personalized results
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pages: number;
  suggestions?: string[];
  facets?: {
    types: { type: string; count: number }[];
    levels: { level: string; count: number }[];
    categories: { category: string; count: number }[];
  };
}

// ============================================
// Main Search Function
// ============================================

export async function unifiedSearch(options: SearchOptions): Promise<SearchResponse> {
  const { query, filters = {}, page = 1, limit = 20, userId } = options;
  const offset = (page - 1) * limit;

  // Check cache first
  const cacheKey = `search:${JSON.stringify({ query, filters, page, limit })}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'Search cache hit');
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.warn({ err: e }, 'Redis cache read failed');
    }
  }

  const searchTerm = query.toLowerCase().trim();
  const typeFilter = filters.type
    ? (Array.isArray(filters.type) ? filters.type : [filters.type])
    : ['program', 'class', 'pose', 'instructor', 'podcast', 'challenge'];

  // Parallel search across all content types
  const searchPromises = [];

  if (typeFilter.includes('program')) {
    searchPromises.push(searchPrograms(searchTerm, filters, limit));
  }
  if (typeFilter.includes('class')) {
    searchPromises.push(searchClasses(searchTerm, filters, limit));
  }
  if (typeFilter.includes('pose')) {
    searchPromises.push(searchPoses(searchTerm, filters, limit));
  }
  if (typeFilter.includes('instructor')) {
    searchPromises.push(searchInstructors(searchTerm, filters, limit));
  }
  if (typeFilter.includes('podcast')) {
    searchPromises.push(searchPodcasts(searchTerm, filters, limit));
  }
  if (typeFilter.includes('challenge')) {
    searchPromises.push(searchChallenges(searchTerm, filters, limit));
  }

  const searchResults = await Promise.all(searchPromises);
  const allResults = searchResults.flat();

  // Sort by relevance score
  allResults.sort((a, b) => b.score - a.score);

  // Paginate
  const paginatedResults = allResults.slice(offset, offset + limit);
  const total = allResults.length;

  // Calculate facets
  const facets = calculateFacets(allResults);

  // Generate suggestions if few results
  let suggestions: string[] = [];
  if (allResults.length < 5 && searchTerm.length > 2) {
    suggestions = await generateSuggestions(searchTerm);
  }

  // Log search for analytics
  await logSearchQuery(searchTerm, total, userId);

  const response: SearchResponse = {
    results: paginatedResults,
    total,
    page,
    pages: Math.ceil(total / limit),
    suggestions,
    facets
  };

  // Cache results
  if (redis) {
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(response)); // 5 min cache
    } catch (e) {
      logger.warn({ err: e }, 'Redis cache write failed');
    }
  }

  return response;
}

// ============================================
// Content-specific Search Functions
// ============================================

async function searchPrograms(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const where: Record<string, unknown> = {
    isPublished: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.level) where.level = filters.level;
  if (filters.duration?.max) where.durationWeeks = { lte: filters.duration.max };
  if (filters.instructorId) where.instructorId = filters.instructorId;

  const programs = await prisma.program.findMany({
    where,
    take: limit,
    orderBy: [
      { enrollmentCount: 'desc' },
      { averageRating: 'desc' }
    ],
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      level: true,
      durationWeeks: true,
      enrollmentCount: true,
      averageRating: true
    }
  });

  return programs.map(p => ({
    type: 'program' as const,
    id: p.id,
    title: p.title,
    description: p.description || '',
    thumbnailUrl: p.thumbnailUrl,
    metadata: {
      level: p.level,
      durationWeeks: p.durationWeeks,
      enrollmentCount: p.enrollmentCount,
      rating: p.averageRating
    },
    score: calculateRelevanceScore(query, p.title, p.description || '', p.enrollmentCount || 0)
  }));
}

async function searchClasses(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const where: Record<string, unknown> = {
    isPublished: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.level) where.level = filters.level;
  if (filters.duration?.max) where.duration = { lte: filters.duration.max };
  if (filters.instructorId) where.instructorId = filters.instructorId;

  const classes = await prisma.class.findMany({
    where,
    take: limit,
    orderBy: [
      { viewCount: 'desc' },
      { averageRating: 'desc' }
    ],
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      level: true,
      duration: true,
      viewCount: true,
      averageRating: true,
      instructor: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  return classes.map(c => ({
    type: 'class' as const,
    id: c.id,
    title: c.title,
    description: c.description || '',
    thumbnailUrl: c.thumbnailUrl,
    metadata: {
      level: c.level,
      duration: c.duration,
      viewCount: c.viewCount,
      rating: c.averageRating,
      instructor: c.instructor ? `${c.instructor.firstName} ${c.instructor.lastName}` : null
    },
    score: calculateRelevanceScore(query, c.title, c.description || '', c.viewCount || 0)
  }));
}

async function searchPoses(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const where: Record<string, unknown> = {
    OR: [
      { englishName: { contains: query, mode: 'insensitive' } },
      { sanskritName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.level) where.difficulty = filters.level;

  const poses = await prisma.pose.findMany({
    where,
    take: limit,
    select: {
      id: true,
      englishName: true,
      sanskritName: true,
      description: true,
      imageUrl: true,
      difficulty: true
    }
  });

  return poses.map(p => ({
    type: 'pose' as const,
    id: p.id,
    title: p.englishName,
    description: p.sanskritName || p.description || '',
    thumbnailUrl: p.imageUrl,
    metadata: {
      sanskritName: p.sanskritName,
      difficulty: p.difficulty
    },
    score: calculateRelevanceScore(query, p.englishName, p.sanskritName || '', 0)
  }));
}

async function searchInstructors(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const instructors = await prisma.user.findMany({
    where: {
      role: 'TEACHER',
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit,
    orderBy: [
      { followerCount: 'desc' },
      { averageRating: 'desc' }
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bio: true,
      avatarUrl: true,
      followerCount: true,
      averageRating: true
    }
  });

  return instructors.map(i => ({
    type: 'instructor' as const,
    id: i.id,
    title: `${i.firstName || ''} ${i.lastName || ''}`.trim(),
    description: i.bio || '',
    thumbnailUrl: i.avatarUrl,
    metadata: {
      followerCount: i.followerCount,
      rating: i.averageRating
    },
    score: calculateRelevanceScore(query, `${i.firstName} ${i.lastName}`, i.bio || '', i.followerCount || 0)
  }));
}

async function searchPodcasts(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.category) where.category = filters.category;

  const podcasts = await prisma.podcast.findMany({
    where,
    take: limit,
    orderBy: [
      { subscriberCount: 'desc' },
      { totalListens: 'desc' }
    ],
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      category: true,
      totalEpisodes: true,
      subscriberCount: true
    }
  });

  return podcasts.map(p => ({
    type: 'podcast' as const,
    id: p.id,
    title: p.title,
    description: p.description,
    thumbnailUrl: p.coverImage,
    metadata: {
      category: p.category,
      episodeCount: p.totalEpisodes,
      subscriberCount: p.subscriberCount
    },
    score: calculateRelevanceScore(query, p.title, p.description, p.subscriberCount || 0)
  }));
}

async function searchChallenges(query: string, filters: SearchFilters, limit: number): Promise<SearchResult[]> {
  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      endDate: { gte: new Date() },
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit,
    orderBy: { participantCount: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      startDate: true,
      endDate: true,
      participantCount: true
    }
  });

  return challenges.map(c => ({
    type: 'challenge' as const,
    id: c.id,
    title: c.title,
    description: c.description || '',
    thumbnailUrl: c.thumbnailUrl,
    metadata: {
      startDate: c.startDate,
      endDate: c.endDate,
      participantCount: c.participantCount
    },
    score: calculateRelevanceScore(query, c.title, c.description || '', c.participantCount || 0)
  }));
}

// ============================================
// Helper Functions
// ============================================

function calculateRelevanceScore(
  query: string,
  title: string,
  description: string,
  popularity: number
): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // Exact title match = highest score
  if (lowerTitle === lowerQuery) score += 100;
  // Title starts with query
  else if (lowerTitle.startsWith(lowerQuery)) score += 80;
  // Title contains query word
  else if (lowerTitle.includes(lowerQuery)) score += 60;

  // Description contains query
  if (lowerDesc.includes(lowerQuery)) score += 20;

  // Popularity boost (logarithmic to prevent domination)
  score += Math.log10(popularity + 1) * 5;

  return score;
}

function calculateFacets(results: SearchResult[]) {
  const types: Record<string, number> = {};
  const levels: Record<string, number> = {};
  const categories: Record<string, number> = {};

  results.forEach(r => {
    types[r.type] = (types[r.type] || 0) + 1;
    if (r.metadata.level) levels[r.metadata.level as string] = (levels[r.metadata.level as string] || 0) + 1;
    if (r.metadata.category) categories[r.metadata.category as string] = (categories[r.metadata.category as string] || 0) + 1;
  });

  return {
    types: Object.entries(types).map(([type, count]) => ({ type, count })),
    levels: Object.entries(levels).map(([level, count]) => ({ level, count })),
    categories: Object.entries(categories).map(([category, count]) => ({ category, count }))
  };
}

async function generateSuggestions(query: string): Promise<string[]> {
  // Get popular search terms that are similar
  const popularSearches = await prisma.searchLog.groupBy({
    by: ['query'],
    where: {
      query: { startsWith: query.slice(0, 3), mode: 'insensitive' },
      resultCount: { gt: 0 }
    },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 5
  });

  return popularSearches.map(s => s.query);
}

async function logSearchQuery(query: string, resultCount: number, userId?: string): Promise<void> {
  try {
    await prisma.searchLog.create({
      data: {
        query,
        resultCount,
        userId,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to log search query');
  }
}

// ============================================
// Trending & Popular
// ============================================

export async function getTrendingSearches(limit = 10): Promise<string[]> {
  const trending = await prisma.searchLog.groupBy({
    by: ['query'],
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      resultCount: { gt: 0 }
    },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: limit
  });

  return trending.map(t => t.query);
}

export async function getPopularContent(type?: string, limit = 10): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (!type || type === 'program') {
    const programs = await prisma.program.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { enrollmentCount: 'desc' },
      select: { id: true, title: true, description: true, thumbnailUrl: true, enrollmentCount: true }
    });
    results.push(...programs.map(p => ({
      type: 'program' as const,
      id: p.id,
      title: p.title,
      description: p.description || '',
      thumbnailUrl: p.thumbnailUrl,
      metadata: { enrollmentCount: p.enrollmentCount },
      score: p.enrollmentCount || 0
    })));
  }

  if (!type || type === 'class') {
    const classes = await prisma.class.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { viewCount: 'desc' },
      select: { id: true, title: true, description: true, thumbnailUrl: true, viewCount: true }
    });
    results.push(...classes.map(c => ({
      type: 'class' as const,
      id: c.id,
      title: c.title,
      description: c.description || '',
      thumbnailUrl: c.thumbnailUrl,
      metadata: { viewCount: c.viewCount },
      score: c.viewCount || 0
    })));
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export type { SearchResult, SearchFilters, SearchOptions, SearchResponse };
