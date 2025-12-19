import { z } from 'zod';

// Enums matching Prisma schema
export const moodLevelEnum = z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']);
export const moodTagCategoryEnum = z.enum(['ACTIVITY', 'SOCIAL', 'HEALTH', 'WEATHER', 'OTHER']);

// Query schemas
export const moodEntryFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mood: moodLevelEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const moodEntryIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const moodDateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Create/Update schemas
export const createMoodEntrySchema = z.object({
  mood: moodLevelEnum,
  moodScore: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
  date: z.string().datetime().optional(), // defaults to now
});

export const updateMoodEntrySchema = z.object({
  mood: moodLevelEnum.optional(),
  moodScore: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// Mood Tag Admin schemas
export const createMoodTagSchema = z.object({
  name: z.string().min(1).max(50),
  nameEn: z.string().min(1).max(50).optional(),
  category: moodTagCategoryEnum,
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().default(true),
});

export const updateMoodTagSchema = createMoodTagSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const moodTagIdParamSchema = z.object({
  id: z.string().cuid(),
});

// Stats query
export const moodStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('week'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Type exports
export type MoodEntryFilters = z.infer<typeof moodEntryFiltersSchema>;
export type CreateMoodEntryInput = z.infer<typeof createMoodEntrySchema>;
export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntrySchema>;
export type CreateMoodTagInput = z.infer<typeof createMoodTagSchema>;
export type UpdateMoodTagInput = z.infer<typeof updateMoodTagSchema>;
export type MoodStatsQuery = z.infer<typeof moodStatsQuerySchema>;
