import { z } from 'zod';

// Create Sleep Tracking
export const createSleepTrackingSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  bedTime: z.string(), // ISO datetime
  wakeTime: z.string(), // ISO datetime
  quality: z.number().int().min(1).max(5).optional(),
  fellAsleepWith: z.enum(['meditation', 'story', 'sounds', 'nothing']).optional(),
  contentId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  dreamNote: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
});
export type CreateSleepTrackingInput = z.infer<typeof createSleepTrackingSchema>;

// Update Sleep Tracking
export const updateSleepTrackingSchema = createSleepTrackingSchema.partial();
export type UpdateSleepTrackingInput = z.infer<typeof updateSleepTrackingSchema>;

// Sleep Tracking ID param
export const sleepTrackingIdParamSchema = z.object({
  id: z.string(),
});

// Sleep Tracking Filters
export const sleepTrackingFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});
export type SleepTrackingFilters = z.infer<typeof sleepTrackingFiltersSchema>;

// Sleep Stats Query
export const sleepStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type SleepStatsQuery = z.infer<typeof sleepStatsQuerySchema>;
