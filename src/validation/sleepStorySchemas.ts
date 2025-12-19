import { z } from 'zod';

// Sleep Story Category
export const sleepStoryCategorySchema = z.enum([
  'NATURE', 'FANTASY', 'TRAVEL', 'RELAXATION', 'SCIENCE',
  'HISTORY', 'CITY', 'AMBIENT', 'BEDTIME', 'COZY'
]);

// Sleep Story Filters
export const sleepStoryFiltersSchema = z.object({
  category: sleepStoryCategorySchema.optional(),
  isPremium: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'playCount', 'averageRating', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type SleepStoryFilters = z.infer<typeof sleepStoryFiltersSchema>;

// Sleep Story ID param
export const sleepStoryIdParamSchema = z.object({
  id: z.string(),
});

// Update Progress
export const updateProgressSchema = z.object({
  currentTime: z.number().int().min(0),
  duration: z.number().int().positive(),
});
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// Rate Story
export const rateStorySchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});
export type RateStoryInput = z.infer<typeof rateStorySchema>;

// Create Sleep Story (Admin)
export const createSleepStorySchema = z.object({
  title: z.string().min(1).max(200),
  titleEn: z.string().max(200).optional(),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  audioUrl: z.string().url(),
  coverImageUrl: z.string().url().optional(),
  duration: z.number().int().positive(),
  narratorName: z.string().optional(),
  category: sleepStoryCategorySchema,
  tags: z.array(z.string()).default([]),
  isPremium: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  backgroundSoundId: z.string().optional(),
});
export type CreateSleepStoryInput = z.infer<typeof createSleepStorySchema>;

// Update Sleep Story (Admin)
export const updateSleepStorySchema = createSleepStorySchema.partial();
export type UpdateSleepStoryInput = z.infer<typeof updateSleepStorySchema>;

// Sleep Timer Settings
export const sleepTimerSettingsSchema = z.object({
  defaultDuration: z.number().int().positive().default(1800),
  fadeOutEnabled: z.boolean().default(true),
  fadeOutDuration: z.number().int().positive().default(60),
  defaultSoundId: z.string().optional(),
  defaultVolume: z.number().int().min(0).max(100).default(50),
  autoPlayNextStory: z.boolean().default(false),
  bedtimeReminder: z.boolean().default(false),
  bedtimeReminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});
export type SleepTimerSettingsInput = z.infer<typeof sleepTimerSettingsSchema>;
