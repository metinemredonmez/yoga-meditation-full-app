import { z } from 'zod';
import { PodcastStatus, EpisodeStatus, PodcastCategory } from '@prisma/client';

// ============================================
// Param Schemas
// ============================================

export const podcastIdParamSchema = z.object({
  podcastId: z.string().min(1),
});

export const episodeIdParamSchema = z.object({
  episodeId: z.string().min(1),
});

export const podcastEpisodeParamSchema = z.object({
  podcastId: z.string().min(1),
  episodeId: z.string().min(1),
});

// ============================================
// Filter Schemas
// ============================================

export const podcastFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.nativeEnum(PodcastCategory).optional(),
  status: z.nativeEnum(PodcastStatus).optional(),
  hostId: z.string().optional(),
  q: z.string().optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'subscriberCount', 'totalListens']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const episodeFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(EpisodeStatus).optional(),
  seasonNumber: z.coerce.number().int().positive().optional(),
  isPremium: z.coerce.boolean().optional(),
  q: z.string().optional(),
  sortBy: z.enum(['createdAt', 'publishedAt', 'episodeNumber', 'listenCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// Create/Update Schemas
// ============================================

export const createPodcastSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  shortDescription: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
  category: z.nativeEnum(PodcastCategory).default('WELLNESS'),
  tagIds: z.array(z.string()).optional(),
  hostId: z.string().optional(),
  hostName: z.string().optional(),
  hostBio: z.string().optional(),
  hostAvatar: z.string().url().optional(),
  status: z.nativeEnum(PodcastStatus).default('DRAFT'),
  isExplicit: z.boolean().default(false),
  language: z.string().default('tr'),
  rssEnabled: z.boolean().default(true),
  websiteUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
});

export const updatePodcastSchema = createPodcastSchema.partial();

export const createEpisodeSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  seasonNumber: z.number().int().positive().optional(),
  episodeNumber: z.number().int().positive(),
  audioUrl: z.string().url().optional(),
  audioFormat: z.string().optional(),
  audioSize: z.number().int().positive().optional(),
  duration: z.number().int().nonnegative().optional(),
  transcript: z.string().optional(),
  chapters: z.array(z.object({
    title: z.string(),
    startTime: z.number(),
    endTime: z.number().optional(),
  })).optional(),
  guestName: z.string().optional(),
  guestBio: z.string().optional(),
  guestAvatar: z.string().url().optional(),
  showNotes: z.string().optional(),
  status: z.nativeEnum(EpisodeStatus).default('DRAFT'),
  isPremium: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const updateEpisodeSchema = createEpisodeSchema.partial();

// ============================================
// Listen Progress Schema
// ============================================

export const listenProgressSchema = z.object({
  progress: z.number().int().min(0),
  duration: z.number().int().positive(),
  completed: z.boolean().optional(),
  source: z.enum(['WEB', 'IOS', 'ANDROID']).optional(),
});

// ============================================
// Type exports
// ============================================

export type PodcastFilters = z.infer<typeof podcastFiltersSchema>;
export type EpisodeFilters = z.infer<typeof episodeFiltersSchema>;
export type CreatePodcastInput = z.infer<typeof createPodcastSchema>;
export type UpdatePodcastInput = z.infer<typeof updatePodcastSchema>;
export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;
export type ListenProgressInput = z.infer<typeof listenProgressSchema>;
