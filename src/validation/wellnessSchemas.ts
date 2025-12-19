import { z } from 'zod';

// ==================== WELLNESS STATS SCHEMAS ====================

// Stats query
export const wellnessStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).optional().default('week'),
});
export type WellnessStatsQuery = z.infer<typeof wellnessStatsQuerySchema>;

// Update activity (called after session completion)
export const recordActivitySchema = z.object({
  type: z.enum(['MEDITATION', 'BREATHWORK', 'SLEEP_STORY', 'JOURNAL', 'MOOD']),
  durationMinutes: z.number().int().min(0).optional(),
  sessionId: z.string().cuid().optional(),
});
export type RecordActivityInput = z.infer<typeof recordActivitySchema>;
