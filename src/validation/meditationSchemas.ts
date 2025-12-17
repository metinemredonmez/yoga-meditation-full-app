import { z } from 'zod';

// Enums matching Prisma schema
export const meditationDifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

// Query parameter schemas
export const meditationFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  difficulty: meditationDifficultyEnum.optional(),
  isFree: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  minDuration: z.coerce.number().int().positive().optional(),
  maxDuration: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'durationSeconds', 'playCount', 'averageRating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const meditationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid(),
});

// Progress update schema
export const updateProgressSchema = z.object({
  progressSeconds: z.number().int().min(0),
  completed: z.boolean().optional(),
});

// Session schemas
export const startSessionSchema = z.object({
  startedAt: z.string().datetime().optional(),
});

export const completeSessionSchema = z.object({
  completedAt: z.string().datetime().optional(),
  listenedSeconds: z.number().int().min(0),
});

// Rating schema
export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

// Admin schemas
export const createMeditationSchema = z.object({
  categoryId: z.string().uuid(),
  instructorId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  titleTr: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  descriptionTr: z.string().optional(),
  difficulty: meditationDifficultyEnum,
  durationSeconds: z.number().int().positive(),
  audioUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  backgroundMusicUrl: z.string().url().optional(),
  isFree: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  benefitsTr: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
});

export const updateMeditationSchema = createMeditationSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// Category admin schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  nameTr: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  descriptionTr: z.string().optional(),
  iconUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// Type exports
export type MeditationFilters = z.infer<typeof meditationFiltersSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type CreateMeditationInput = z.infer<typeof createMeditationSchema>;
export type UpdateMeditationInput = z.infer<typeof updateMeditationSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
