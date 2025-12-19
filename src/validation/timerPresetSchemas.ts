import { z } from 'zod';

// Create Timer Preset
export const createTimerPresetSchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive(),
  intervalBell: z.number().int().positive().optional(),
  startBell: z.string().optional(),
  endBell: z.string().optional(),
  intervalBellSound: z.string().optional(),
  backgroundSoundId: z.string().optional(),
  backgroundVolume: z.number().int().min(0).max(100).default(50),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().default(0),
});
export type CreateTimerPresetInput = z.infer<typeof createTimerPresetSchema>;

// Update Timer Preset
export const updateTimerPresetSchema = createTimerPresetSchema.partial();
export type UpdateTimerPresetInput = z.infer<typeof updateTimerPresetSchema>;

// Timer Preset ID param
export const timerPresetIdParamSchema = z.object({
  id: z.string(),
});

// Timer Preset Filters
export const timerPresetFiltersSchema = z.object({
  isSystem: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
export type TimerPresetFilters = z.infer<typeof timerPresetFiltersSchema>;
