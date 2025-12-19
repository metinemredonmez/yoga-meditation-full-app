import { z } from 'zod';

// Enums
export const quoteCategoryEnum = z.enum([
  'MOTIVATION', 'MINDFULNESS', 'HAPPINESS', 'PEACE',
  'SELF_LOVE', 'YOGA', 'SUFI', 'GRATITUDE'
]);

// Query schemas
export const dailyContentDateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const quoteFiltersSchema = z.object({
  category: quoteCategoryEnum.optional(),
  language: z.string().min(2).max(5).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const quoteIdParamSchema = z.object({
  id: z.string().cuid(),
});

// Admin schemas
export const createQuoteSchema = z.object({
  text: z.string().min(1).max(1000),
  textEn: z.string().min(1).max(1000).optional(),
  author: z.string().max(200).optional(),
  category: quoteCategoryEnum.default('MOTIVATION'),
  language: z.string().min(2).max(5).default('tr'),
  scheduledDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateQuoteSchema = createQuoteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const createDailyContentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  quoteId: z.string().cuid().optional(),
  meditationId: z.string().cuid().optional(),
  breathworkId: z.string().cuid().optional(),
  tip: z.string().max(500).optional(),
  challenge: z.string().max(500).optional(),
  isPublished: z.boolean().default(true),
});

export const updateDailyContentSchema = createDailyContentSchema.partial().omit({ date: true }).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

export const dailyContentIdParamSchema = z.object({
  id: z.string().cuid(),
});

// Type exports
export type QuoteFilters = z.infer<typeof quoteFiltersSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateDailyContentInput = z.infer<typeof createDailyContentSchema>;
export type UpdateDailyContentInput = z.infer<typeof updateDailyContentSchema>;
