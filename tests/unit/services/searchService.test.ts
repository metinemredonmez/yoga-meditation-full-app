import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../../src/utils/database', () => ({
  prisma: {
    program: {
      findMany: vi.fn()
    },
    class: {
      findMany: vi.fn()
    },
    pose: {
      findMany: vi.fn()
    },
    user: {
      findMany: vi.fn()
    },
    podcast: {
      findMany: vi.fn()
    },
    challenge: {
      findMany: vi.fn()
    },
    searchLog: {
      create: vi.fn(),
      groupBy: vi.fn()
    }
  }
}));

vi.mock('../../../src/utils/redis', () => ({
  getRedisClient: vi.fn(() => null)
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import { unifiedSearch, getTrendingSearches, getPopularContent } from '../../../src/services/searchService';
import { prisma } from '../../../src/utils/database';

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unifiedSearch', () => {
    it('should return empty results for empty query', async () => {
      // Setup mocks
      vi.mocked(prisma.program.findMany).mockResolvedValue([]);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pose.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.podcast.findMany).mockResolvedValue([]);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.searchLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([]);

      const result = await unifiedSearch({ query: '' });

      expect(result).toBeDefined();
      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should search programs when type filter includes program', async () => {
      const mockPrograms = [
        {
          id: 'prog-1',
          title: 'Morning Yoga',
          description: 'Start your day right',
          thumbnailUrl: 'https://example.com/img.jpg',
          level: 'BEGINNER',
          durationWeeks: 4,
          enrollmentCount: 100,
          averageRating: 4.5
        }
      ];

      vi.mocked(prisma.program.findMany).mockResolvedValue(mockPrograms as never);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pose.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.podcast.findMany).mockResolvedValue([]);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.searchLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([]);

      const result = await unifiedSearch({
        query: 'morning',
        filters: { type: 'program' }
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].type).toBe('program');
      expect(result.results[0].title).toBe('Morning Yoga');
    });

    it('should respect pagination', async () => {
      vi.mocked(prisma.program.findMany).mockResolvedValue([]);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pose.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.podcast.findMany).mockResolvedValue([]);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.searchLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([]);

      const result = await unifiedSearch({
        query: 'yoga',
        page: 2,
        limit: 10
      });

      expect(result.page).toBe(2);
    });

    it('should calculate facets correctly', async () => {
      const mockPrograms = [
        {
          id: 'prog-1',
          title: 'Yoga Program',
          description: 'Description',
          thumbnailUrl: null,
          level: 'BEGINNER',
          durationWeeks: 4,
          enrollmentCount: 100,
          averageRating: 4.5
        }
      ];

      const mockClasses = [
        {
          id: 'class-1',
          title: 'Yoga Class',
          description: 'Description',
          thumbnailUrl: null,
          level: 'INTERMEDIATE',
          duration: 30,
          viewCount: 50,
          averageRating: 4.0,
          instructor: { firstName: 'John', lastName: 'Doe' }
        }
      ];

      vi.mocked(prisma.program.findMany).mockResolvedValue(mockPrograms as never);
      vi.mocked(prisma.class.findMany).mockResolvedValue(mockClasses as never);
      vi.mocked(prisma.pose.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.podcast.findMany).mockResolvedValue([]);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.searchLog.create).mockResolvedValue({} as never);
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([]);

      const result = await unifiedSearch({ query: 'yoga' });

      expect(result.facets).toBeDefined();
      expect(result.facets?.types).toBeDefined();
      expect(result.facets?.levels).toBeDefined();
    });
  });

  describe('getTrendingSearches', () => {
    it('should return trending searches', async () => {
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([
        { query: 'yoga', _count: { query: 100 } },
        { query: 'meditation', _count: { query: 80 } }
      ] as never);

      const result = await getTrendingSearches(5);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('yoga');
      expect(result[1]).toBe('meditation');
    });

    it('should respect limit parameter', async () => {
      vi.mocked(prisma.searchLog.groupBy).mockResolvedValue([
        { query: 'yoga', _count: { query: 100 } }
      ] as never);

      const result = await getTrendingSearches(1);

      expect(prisma.searchLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );
    });
  });

  describe('getPopularContent', () => {
    it('should return popular programs', async () => {
      const mockPrograms = [
        {
          id: 'prog-1',
          title: 'Popular Program',
          description: 'Description',
          thumbnailUrl: null,
          enrollmentCount: 1000
        }
      ];

      vi.mocked(prisma.program.findMany).mockResolvedValue(mockPrograms as never);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);

      const result = await getPopularContent('program', 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('program');
    });

    it('should return mixed content when no type specified', async () => {
      const mockPrograms = [
        {
          id: 'prog-1',
          title: 'Program',
          description: 'Desc',
          thumbnailUrl: null,
          enrollmentCount: 100
        }
      ];

      const mockClasses = [
        {
          id: 'class-1',
          title: 'Class',
          description: 'Desc',
          thumbnailUrl: null,
          viewCount: 200
        }
      ];

      vi.mocked(prisma.program.findMany).mockResolvedValue(mockPrograms as never);
      vi.mocked(prisma.class.findMany).mockResolvedValue(mockClasses as never);

      const result = await getPopularContent(undefined, 10);

      expect(result.length).toBe(2);
    });
  });
});
