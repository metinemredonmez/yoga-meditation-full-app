import { z } from 'zod';

// Journal Types
export const journalTypeEnum = z.enum([
  'FREE_WRITE',
  'GRATITUDE',
  'REFLECTION',
  'DREAM',
  'MOOD',
  'PRACTICE_NOTES',
  'INTENTION',
  'AFFIRMATION',
  'MORNING_PAGES',
  'EVENING_REVIEW',
]);

export type JournalType = z.infer<typeof journalTypeEnum>;

// Create Journal Entry
export const createJournalEntrySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(50000),
  type: journalTypeEnum.default('FREE_WRITE'),
  promptId: z.string().optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  images: z.array(z.string().url()).max(5).default([]),
  audioUrl: z.string().url().optional(),
  isPrivate: z.boolean().default(true),
  date: z.string().datetime().optional(),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

// Update Journal Entry
export const updateJournalEntrySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  type: journalTypeEnum.optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  images: z.array(z.string().url()).max(5).optional(),
  audioUrl: z.string().url().nullable().optional(),
  isPrivate: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;

// Journal Entry Filters
export const journalFiltersSchema = z.object({
  type: journalTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).optional(),
  tags: z.string().optional(), // comma separated
  isFavorite: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'createdAt', 'wordCount']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type JournalFilters = z.infer<typeof journalFiltersSchema>;

// Journal Entry ID Param
export const journalEntryIdParamSchema = z.object({
  id: z.string(),
});

// Calendar Query
export const journalCalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type JournalCalendarQuery = z.infer<typeof journalCalendarQuerySchema>;

// Stats Query
export const journalStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type JournalStatsQuery = z.infer<typeof journalStatsQuerySchema>;

// Search Query
export const journalSearchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type JournalSearchQuery = z.infer<typeof journalSearchQuerySchema>;

// Create Journal Prompt (Admin)
export const createJournalPromptSchema = z.object({
  prompt: z.string().min(1).max(500),
  promptEn: z.string().max(500).optional(),
  type: journalTypeEnum,
  category: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreateJournalPromptInput = z.infer<typeof createJournalPromptSchema>;

// Update Journal Prompt (Admin)
export const updateJournalPromptSchema = z.object({
  prompt: z.string().min(1).max(500).optional(),
  promptEn: z.string().max(500).optional(),
  type: journalTypeEnum.optional(),
  category: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateJournalPromptInput = z.infer<typeof updateJournalPromptSchema>;

// Prompt Filters
export const promptFiltersSchema = z.object({
  type: journalTypeEnum.optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PromptFilters = z.infer<typeof promptFiltersSchema>;
