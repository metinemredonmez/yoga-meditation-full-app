import { z } from 'zod';

// Enums matching Prisma schema
export const breathworkPatternEnum = z.enum(['BOX', 'FOUR_SEVEN_EIGHT', 'ALTERNATE_NOSTRIL', 'RELAXATION', 'ENERGIZING', 'CUSTOM']);
export const breathworkCategoryEnum = z.enum(['CALM', 'FOCUS', 'ENERGY', 'SLEEP', 'STRESS', 'ANXIETY']);
export const breathworkAnimationEnum = z.enum(['CIRCLE', 'WAVE', 'LUNG', 'MINIMAL']);

// Difficulty enum for breathwork
export const breathworkDifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

// Query parameter schemas
export const breathworkFiltersSchema = z.object({
  category: breathworkCategoryEnum.optional(),
  pattern: breathworkPatternEnum.optional(),
  difficulty: breathworkDifficultyEnum.optional(),
  instructorId: z.string().min(1).optional(),
  isFree: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPremium: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  minDuration: z.coerce.number().int().positive().optional(),
  maxDuration: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'durationSeconds', 'playCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const breathworkIdParamSchema = z.object({
  id: z.string().min(1),
});

// Progress update schema
export const updateBreathworkProgressSchema = z.object({
  progressSeconds: z.number().int().min(0),
  cyclesCompleted: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

// Session schemas
export const startBreathworkSessionSchema = z.object({
  startedAt: z.string().datetime().optional(),
});

export const completeBreathworkSessionSchema = z.object({
  completedAt: z.string().datetime().optional(),
  practicedSeconds: z.number().int().min(0),
  cyclesCompleted: z.number().int().min(0),
});

// Admin schemas
export const createBreathworkSchema = z.object({
  title: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  descriptionEn: z.string().optional(),
  category: breathworkCategoryEnum,
  pattern: breathworkPatternEnum,
  animation: breathworkAnimationEnum.default('CIRCLE'),
  durationSeconds: z.number().int().positive(),
  inhaleSeconds: z.number().int().positive(),
  holdInSeconds: z.number().int().min(0).default(0),
  exhaleSeconds: z.number().int().positive(),
  holdOutSeconds: z.number().int().min(0).default(0),
  cycles: z.number().int().positive().default(4),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  isFree: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  benefits: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const updateBreathworkSchema = createBreathworkSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// Type exports
export type BreathworkFilters = z.infer<typeof breathworkFiltersSchema>;
export type UpdateBreathworkProgressInput = z.infer<typeof updateBreathworkProgressSchema>;
export type StartBreathworkSessionInput = z.infer<typeof startBreathworkSessionSchema>;
export type CompleteBreathworkSessionInput = z.infer<typeof completeBreathworkSessionSchema>;
export type CreateBreathworkInput = z.infer<typeof createBreathworkSchema>;
export type UpdateBreathworkInput = z.infer<typeof updateBreathworkSchema>;
