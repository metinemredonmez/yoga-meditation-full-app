import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { TranslationStatus } from '@prisma/client';
import * as languageService from './languageService';

// In-memory cache for translations
const translationCache = new Map<string, Map<string, string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheUpdate = 0;

// ============================================
// Translation Key Management
// ============================================

export async function createTranslationKey(data: {
  key: string;
  namespace?: string;
  description?: string;
  context?: string;
  maxLength?: number;
}) {
  return prisma.translation_keys.create({
    data: {
      key: data.key,
      namespace: data.namespace || 'common',
      description: data.description,
      context: data.context,
      maxLength: data.maxLength,
    },
  });
}

export async function getTranslationKeys(namespace?: string) {
  return prisma.translation_keys.findMany({
    where: namespace ? { namespace } : {},
    include: {
      translations: {
        include: { languages: true },
      },
    },
    orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
  });
}

export async function getTranslationKeyById(id: string) {
  return prisma.translation_keys.findUnique({
    where: { id },
    include: {
      translations: {
        include: { languages: true },
      },
    },
  });
}

export async function updateTranslationKey(
  id: string,
  data: Partial<{
    key: string;
    namespace: string;
    description: string;
    context: string;
    maxLength: number;
  }>,
) {
  return prisma.translation_keys.update({
    where: { id },
    data,
  });
}

export async function deleteTranslationKey(id: string) {
  return prisma.translation_keys.delete({ where: { id } });
}

// ============================================
// Translation Management
// ============================================

export async function setTranslation(
  keyId: string,
  languageId: string,
  value: string,
  options?: {
    pluralOne?: string;
    pluralOther?: string;
    pluralZero?: string;
    pluralFew?: string;
    pluralMany?: string;
    status?: TranslationStatus;
    isMachineTranslated?: boolean;
  },
) {
  const translation = await prisma.translations.upsert({
    where: {
      keyId_languageId: { keyId, languageId },
    },
    create: {
      keyId,
      languageId,
      value,
      ...options,
    },
    update: {
      value,
      ...options,
    },
    include: { translation_keys: true, languages: true },
  });

  // Invalidate cache
  invalidateCache();

  return translation;
}

export async function getTranslation(keyId: string, languageId: string) {
  return prisma.translations.findUnique({
    where: {
      keyId_languageId: { keyId, languageId },
    },
    include: { translation_keys: true, languages: true },
  });
}

export async function deleteTranslation(keyId: string, languageId: string) {
  await prisma.translations.delete({
    where: {
      keyId_languageId: { keyId, languageId },
    },
  });
  invalidateCache();
}

export async function verifyTranslation(
  keyId: string,
  languageId: string,
  verifiedById: string,
) {
  return prisma.translations.update({
    where: {
      keyId_languageId: { keyId, languageId },
    },
    data: {
      isVerified: true,
      verifiedById,
      verifiedAt: new Date(),
      status: 'APPROVED',
    },
  });
}

export async function updateTranslationStatus(
  keyId: string,
  languageId: string,
  status: TranslationStatus,
) {
  return prisma.translations.update({
    where: {
      keyId_languageId: { keyId, languageId },
    },
    data: { status },
  });
}

// ============================================
// Translation Retrieval (with caching)
// ============================================

export async function loadTranslationsToCache() {
  const now = Date.now();
  if (now - lastCacheUpdate < CACHE_TTL && translationCache.size > 0) {
    return; // Cache is still fresh
  }

  const translations = await prisma.translations.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      translation_keys: true,
      languages: true,
    },
  });

  translationCache.clear();

  for (const t of translations) {
    const langCode = t.languages.code;
    if (!translationCache.has(langCode)) {
      translationCache.set(langCode, new Map());
    }
    translationCache.get(langCode)!.set(t.translation_keys.key, t.value);
  }

  lastCacheUpdate = now;
  logger.debug({ count: translations.length }, 'Translations loaded to cache');
}

export async function translate(
  key: string,
  languageCode: string,
  params?: Record<string, string | number>,
  count?: number,
): Promise<string> {
  await loadTranslationsToCache();

  // Try requested language
  let value = translationCache.get(languageCode)?.get(key);

  // Try fallback to default language
  if (!value) {
    const defaultLang = await languageService.getDefaultLanguage();
    value = translationCache.get(defaultLang.code)?.get(key);
  }

  // Return key if no translation found
  if (!value) {
    return key;
  }

  // Handle pluralization
  if (count !== undefined) {
    value = await getPluralForm(key, languageCode, count) || value;
  }

  // Replace parameters
  if (params) {
    for (const [param, paramValue] of Object.entries(params)) {
      value = value.replace(new RegExp(`{{${param}}}`, 'g'), String(paramValue));
    }
  }

  return value;
}

async function getPluralForm(
  key: string,
  languageCode: string,
  count: number,
): Promise<string | null> {
  const keyRecord = await prisma.translation_keys.findUnique({ where: { key } });
  if (!keyRecord) return null;

  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) return null;

  const translation = await prisma.translations.findUnique({
    where: {
      keyId_languageId: { keyId: keyRecord.id, languageId: language.id },
    },
  });

  if (!translation) return null;

  // Simple plural rules (can be extended for complex languages)
  if (count === 0 && translation.pluralZero) {
    return translation.pluralZero;
  }
  if (count === 1 && translation.pluralOne) {
    return translation.pluralOne;
  }
  if (translation.pluralOther) {
    return translation.pluralOther;
  }

  return null;
}

export function invalidateCache() {
  lastCacheUpdate = 0;
  translationCache.clear();
}

// ============================================
// Get All Translations for Language
// ============================================

export async function getTranslationsForLanguage(
  languageCode: string,
  namespace?: string,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    return {};
  }

  const translations = await prisma.translations.findMany({
    where: {
      languageId: language.id,
      status: 'PUBLISHED',
      ...(namespace && { translation_keys: { namespace } }),
    },
    include: { translation_keys: true },
  });

  const result: Record<string, string> = {};
  for (const t of translations) {
    result[t.translation_keys.key] = t.value;
  }

  return result;
}

export async function getTranslationsByNamespace(languageCode: string) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    return {};
  }

  const translations = await prisma.translations.findMany({
    where: {
      languageId: language.id,
      status: 'PUBLISHED',
    },
    include: { translation_keys: true },
  });

  const result: Record<string, Record<string, string>> = {};
  for (const t of translations) {
    const namespace = t.translation_keys.namespace || 'common';
    if (!result[namespace]) {
      result[namespace] = {};
    }
    result[namespace][t.translation_keys.key] = t.value;
  }

  return result;
}

// ============================================
// Translation Progress & Stats
// ============================================

export async function getTranslationProgress() {
  const languages = await languageService.getLanguages();
  const totalKeys = await prisma.translation_keys.count();

  const progress = await Promise.all(
    languages.map(async (lang) => {
      const translated = await prisma.translations.count({
        where: { languageId: lang.id, status: 'PUBLISHED' },
      });
      const pending = await prisma.translations.count({
        where: { languageId: lang.id, status: 'PENDING_REVIEW' },
      });
      const draft = await prisma.translations.count({
        where: { languageId: lang.id, status: 'DRAFT' },
      });

      return {
        language: lang,
        totalKeys,
        translated,
        pending,
        draft,
        missing: totalKeys - translated - pending - draft,
        progress: totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 0,
      };
    }),
  );

  return progress;
}

export async function getMissingTranslations(languageId: string) {
  const allKeys = await prisma.translation_keys.findMany();
  const existingTranslations = await prisma.translations.findMany({
    where: { languageId },
    select: { keyId: true },
  });

  const existingKeyIds = new Set(existingTranslations.map((t) => t.keyId));
  return allKeys.filter((key) => !existingKeyIds.has(key.id));
}

// ============================================
// Bulk Operations
// ============================================

export async function importTranslations(
  languageCode: string,
  translations: Record<string, string>,
  namespace = 'common',
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  const results = { created: 0, updated: 0, errors: 0 };

  for (const [key, value] of Object.entries(translations)) {
    try {
      // Ensure key exists
      let keyRecord = await prisma.translation_keys.findUnique({ where: { key } });
      if (!keyRecord) {
        keyRecord = await prisma.translation_keys.create({
          data: { key, namespace },
        });
      }

      // Upsert translation
      const existing = await prisma.translations.findUnique({
        where: {
          keyId_languageId: { keyId: keyRecord.id, languageId: language.id },
        },
      });

      if (existing) {
        await prisma.translations.update({
          where: { id: existing.id },
          data: { value, status: 'PENDING_REVIEW' },
        });
        results.updated++;
      } else {
        await prisma.translations.create({
          data: {
            keyId: keyRecord.id,
            languageId: language.id,
            value,
            status: 'DRAFT',
          },
        });
        results.created++;
      }
    } catch (error) {
      logger.error({ error, key }, 'Failed to import translation');
      results.errors++;
    }
  }

  invalidateCache();
  logger.info({ languageCode, ...results }, 'Translations imported');

  return results;
}

export async function exportTranslations(languageCode: string, namespace?: string) {
  const translations = await getTranslationsForLanguage(languageCode, namespace);
  return translations;
}

export async function publishAllPendingTranslations(languageId: string) {
  const result = await prisma.translations.updateMany({
    where: {
      languageId,
      status: { in: ['DRAFT', 'PENDING_REVIEW', 'APPROVED'] },
    },
    data: { status: 'PUBLISHED' },
  });

  invalidateCache();
  return result;
}
