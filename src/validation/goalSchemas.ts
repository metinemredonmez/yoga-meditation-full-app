import { z } from 'zod';

// Goal Type
export const goalTypeEnum = z.enum([
  'PRACTICE_DAYS',
  'PRACTICE_MINUTES',
  'MEDITATION_COUNT',
  'BREATHWORK_COUNT',
  'STREAK',
  'MOOD_LOG',
  'JOURNAL_ENTRIES',
  'SLEEP_TRACKING',
  'CUSTOM',
]);

export type GoalType = z.infer<typeof goalTypeEnum>;

// Goal Period
export const goalPeriodEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']);
export type GoalPeriod = z.infer<typeof goalPeriodEnum>;

// Create Goal
export const createGoalSchema = z.object({
  type: goalTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  targetValue: z.number().int().min(1),
  unit: z.string().min(1).max(50),
  period: goalPeriodEnum,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// Update Goal
export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  targetValue: z.number().int().min(1).optional(),
  unit: z.string().min(1).max(50).optional(),
  period: goalPeriodEnum.optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// Goal Filters
export const goalFiltersSchema = z.object({
  type: goalTypeEnum.optional(),
  period: goalPeriodEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  isCompleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GoalFilters = z.infer<typeof goalFiltersSchema>;

// Goal ID Param
export const goalIdParamSchema = z.object({
  id: z.string(),
});

// Add Progress
export const addProgressSchema = z.object({
  value: z.number().int().min(1),
  date: z.string().datetime().optional(),
  source: z.string().max(50).optional(),
  sourceId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export type AddProgressInput = z.infer<typeof addProgressSchema>;

// Progress Filters
export const progressFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ProgressFilters = z.infer<typeof progressFiltersSchema>;

// Goal Template
export const goalTemplateSchema = z.object({
  type: goalTypeEnum,
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  targetValue: z.number().int(),
  unit: z.string(),
  period: goalPeriodEnum,
  icon: z.string().optional(),
});

export type GoalTemplate = z.infer<typeof goalTemplateSchema>;
