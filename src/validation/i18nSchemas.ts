import { z } from 'zod';

// ============================================
// Language Schemas
// ============================================

export const createLanguageBodySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Invalid language code format'),
  name: z.string().min(1).max(100),
  nativeName: z.string().min(1).max(100),
  direction: z.enum(['LTR', 'RTL']).optional().default('LTR'),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  flagEmoji: z.string().max(10).optional(),
  flagUrl: z.string().url().optional(),
  fallbackId: z.string().optional(),
});

export const updateLanguageBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nativeName: z.string().min(1).max(100).optional(),
  direction: z.enum(['LTR', 'RTL']).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  flagEmoji: z.string().max(10).optional(),
  flagUrl: z.string().url().optional(),
  fallbackId: z.string().optional(),
});

// ============================================
// Translation Key Schemas
// ============================================

export const createTranslationKeyBodySchema = z.object({
  key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Key must be alphanumeric with dots and underscores'),
  namespace: z.string().min(1).max(50).optional().default('common'),
  description: z.string().max(500).optional(),
  context: z.string().max(500).optional(),
  maxLength: z.number().int().positive().optional(),
});

export const updateTranslationKeyBodySchema = z.object({
  key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_.]+$/)
    .optional(),
  namespace: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  context: z.string().max(500).optional(),
  maxLength: z.number().int().positive().optional(),
});

// ============================================
// Translation Schemas
// ============================================

export const setTranslationBodySchema = z.object({
  value: z.string().min(1),
  pluralOne: z.string().optional(),
  pluralOther: z.string().optional(),
  pluralZero: z.string().optional(),
  pluralFew: z.string().optional(),
  pluralMany: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED']).optional(),
  isMachineTranslated: z.boolean().optional().default(false),
});

export const updateTranslationStatusBodySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED']),
});

export const translateBodySchema = z.object({
  key: z.string().min(1),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  count: z.number().int().optional(),
});

export const translateBatchBodySchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(100),
  params: z.record(z.string(), z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
});

// ============================================
// Content Translation Schemas
// ============================================

export const setContentTranslationBodySchema = z.object({
  value: z.string().min(1),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED']).optional(),
  isMachineTranslated: z.boolean().optional().default(false),
  originalLanguageCode: z.string().min(2).max(5).optional(),
});

export const setMultipleContentTranslationsBodySchema = z.object({
  translations: z.array(
    z.object({
      field: z.string().min(1).max(100),
      languageCode: z.string().min(2).max(5),
      value: z.string().min(1),
      isMachineTranslated: z.boolean().optional().default(false),
    }),
  ),
});

// ============================================
// User Language Preference Schemas
// ============================================

export const setUserLanguagePreferenceBodySchema = z.object({
  languageCode: z.string().min(2).max(5),
  autoDetect: z.boolean().optional().default(true),
});

// ============================================
// Import/Export Schemas
// ============================================

export const importTranslationsBodySchema = z.object({
  languageCode: z.string().min(2).max(5),
  translations: z.record(z.string(), z.string()),
  namespace: z.string().min(1).max(50).optional().default('common'),
});

// ============================================
// Query Schemas
// ============================================

export const translationsQuerySchema = z.object({
  lang: z.string().min(2).max(5).optional(),
  namespace: z.string().min(1).max(50).optional(),
  namespaces: z.string().optional(), // comma-separated
});

export const translationKeysQuerySchema = z.object({
  namespace: z.string().min(1).max(50).optional(),
});

export const languagesQuerySchema = z.object({
  includeInactive: z.enum(['true', 'false']).optional(),
});

export const untranslatedContentQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
});

export const contentProgressQuerySchema = z.object({
  fields: z.string().optional(), // comma-separated required fields
});
