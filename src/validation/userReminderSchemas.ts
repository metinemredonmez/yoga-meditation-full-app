import { z } from 'zod';

// Reminder Type
export const reminderTypeEnum = z.enum([
  'MORNING',
  'EVENING',
  'PRACTICE',
  'MOOD',
  'JOURNAL',
  'HYDRATION',
  'POSTURE',
  'BREAK',
  'BEDTIME',
  'CUSTOM',
]);

export type ReminderType = z.infer<typeof reminderTypeEnum>;

// Days
export const daysEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'EVERYDAY',
]);

// Create Reminder
export const createUserReminderSchema = z.object({
  type: reminderTypeEnum,
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  days: z.array(daysEnum).min(1),
  timezone: z.string().default('Europe/Istanbul'),
  isEnabled: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  vibrationEnabled: z.boolean().default(true),
});

export type CreateUserReminderInput = z.infer<typeof createUserReminderSchema>;

// Update Reminder
export const updateUserReminderSchema = z.object({
  type: reminderTypeEnum.optional(),
  title: z.string().min(1).max(100).optional(),
  message: z.string().max(500).nullable().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  days: z.array(daysEnum).min(1).optional(),
  timezone: z.string().optional(),
  isEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
});

export type UpdateUserReminderInput = z.infer<typeof updateUserReminderSchema>;

// Reminder Filters
export const userReminderFiltersSchema = z.object({
  type: reminderTypeEnum.optional(),
  isEnabled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type UserReminderFilters = z.infer<typeof userReminderFiltersSchema>;

// Reminder ID Param
export const userReminderIdParamSchema = z.object({
  id: z.string(),
});

// Reminder Template
export const reminderTemplateSchema = z.object({
  type: reminderTypeEnum,
  title: z.string(),
  titleEn: z.string().optional(),
  message: z.string().optional(),
  messageEn: z.string().optional(),
  time: z.string(),
  icon: z.string().optional(),
});

export type ReminderTemplate = z.infer<typeof reminderTemplateSchema>;
