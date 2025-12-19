import { z } from 'zod';

// Session Types
export const sessionTypeSchema = z.enum(['GUIDED', 'TIMER', 'OPEN']);
export const sessionStatusSchema = z.enum(['IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED']);
export const moodLevelSchema = z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']);

// Start Session
export const startSessionSchema = z.object({
  meditationId: z.string().optional(),
  type: sessionTypeSchema.default('GUIDED'),
  targetDuration: z.number().int().positive(),
  intervalBell: z.number().int().positive().optional(),
  endBell: z.string().optional(),
  backgroundSoundId: z.string().optional(),
  backgroundVolume: z.number().int().min(0).max(100).default(50),
  mood: moodLevelSchema.optional(),
});
export type StartSessionInput = z.infer<typeof startSessionSchema>;

// Update Session
export const updateSessionSchema = z.object({
  actualDuration: z.number().int().min(0).optional(),
  note: z.string().max(500).optional(),
  mood: moodLevelSchema.optional(),
});
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// Session ID param
export const sessionIdParamSchema = z.object({
  id: z.string(),
});

// Session Filters
export const sessionFiltersSchema = z.object({
  type: sessionTypeSchema.optional(),
  status: sessionStatusSchema.optional(),
  meditationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type SessionFilters = z.infer<typeof sessionFiltersSchema>;

// Session Stats Query
export const sessionStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).default('week'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type SessionStatsQuery = z.infer<typeof sessionStatsQuerySchema>;
