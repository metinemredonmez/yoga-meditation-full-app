import { z } from 'zod';

// Enums matching Prisma schema
export const soundscapeCategoryEnum = z.enum([
  'RAIN', 'THUNDER', 'OCEAN', 'FOREST', 'BIRDS', 'FIRE',
  'WHITE_NOISE', 'PINK_NOISE', 'BROWN_NOISE', 'CAFE', 'CITY',
  'WIND', 'WATER', 'TIBETAN_BOWLS', 'MUSIC', 'OTHER'
]);

// Query parameter schemas
export const soundscapeFiltersSchema = z.object({
  category: soundscapeCategoryEnum.optional(),
  isPremium: z.coerce.boolean().optional(),
  isFree: z.coerce.boolean().optional(),
  isMixable: z.coerce.boolean().optional(),
  isLoop: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'playCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const soundscapeIdParamSchema = z.object({
  id: z.string().cuid(),
});

// Mix schemas
export const mixItemSchema = z.object({
  soundscapeId: z.string().cuid(),
  volume: z.number().int().min(0).max(100).default(50),
});

export const createMixSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  items: z.array(mixItemSchema).min(1).max(10),
});

export const updateMixSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  items: z.array(mixItemSchema).min(1).max(10).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const mixIdParamSchema = z.object({
  mixId: z.string().cuid(),
});

// Admin schemas
export const createSoundscapeSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200).optional(),
  audioUrl: z.string().url(),
  coverImage: z.string().url().optional(),
  duration: z.number().int().positive().optional(), // null = loop
  isLoop: z.boolean().default(true),
  category: soundscapeCategoryEnum,
  isPremium: z.boolean().default(false),
  isMixable: z.boolean().default(true),
  defaultVolume: z.number().int().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
});

export const updateSoundscapeSchema = createSoundscapeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// Type exports
export type SoundscapeFilters = z.infer<typeof soundscapeFiltersSchema>;
export type MixItemInput = z.infer<typeof mixItemSchema>;
export type CreateMixInput = z.infer<typeof createMixSchema>;
export type UpdateMixInput = z.infer<typeof updateMixSchema>;
export type CreateSoundscapeInput = z.infer<typeof createSoundscapeSchema>;
export type UpdateSoundscapeInput = z.infer<typeof updateSoundscapeSchema>;
