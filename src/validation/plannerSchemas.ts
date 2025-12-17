import { z } from 'zod';

export const createPlannerEntrySchema = z.object({
  itemType: z.enum(['PROGRAM_SESSION', 'CLASS']),
  itemId: z.string().min(1, 'itemId is required'),
  plannedAt: z.string().datetime({ message: 'plannedAt must be ISO8601 date string' }),
});

export const plannerEntryIdParamSchema = z.object({
  entryId: z.string().min(1, 'Invalid entry id'),
});

export const plannerQuerySchema = z.object({
  weekStart: z.string().datetime().optional(),
});

export type CreatePlannerEntryInput = z.infer<typeof createPlannerEntrySchema>;
export type PlannerQueryInput = z.infer<typeof plannerQuerySchema>;
