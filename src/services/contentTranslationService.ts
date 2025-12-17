import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { ContentEntityType, TranslationStatus } from '@prisma/client';
import * as languageService from './languageService';

// ============================================
// Content Translation Management
// ============================================

export async function setContentTranslation(
  entityType: ContentEntityType,
  entityId: string,
  field: string,
  languageCode: string,
  value: string,
  options?: {
    status?: TranslationStatus;
    isMachineTranslated?: boolean;
    originalLanguageCode?: string;
  },
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  let originalLanguageId: string | undefined;
  if (options?.originalLanguageCode) {
    const origLang = await languageService.getLanguageByCode(options.originalLanguageCode);
    originalLanguageId = origLang?.id;
  }

  return prisma.contentTranslation.upsert({
    where: {
      entityType_entityId_field_languageId: {
        entityType,
        entityId,
        field,
        languageId: language.id,
      },
    },
    create: {
      entityType,
      entityId,
      field,
      languageId: language.id,
      value,
      status: options?.status || 'DRAFT',
      isMachineTranslated: options?.isMachineTranslated || false,
      originalLanguageId,
    },
    update: {
      value,
      status: options?.status,
      isMachineTranslated: options?.isMachineTranslated,
      originalLanguageId,
    },
    include: { language: true },
  });
}

export async function getContentTranslation(
  entityType: ContentEntityType,
  entityId: string,
  field: string,
  languageCode: string,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) return null;

  return prisma.contentTranslation.findUnique({
    where: {
      entityType_entityId_field_languageId: {
        entityType,
        entityId,
        field,
        languageId: language.id,
      },
    },
    include: { language: true },
  });
}

export async function getContentTranslations(
  entityType: ContentEntityType,
  entityId: string,
  languageCode?: string,
) {
  const where: any = { entityType, entityId };

  if (languageCode) {
    const language = await languageService.getLanguageByCode(languageCode);
    if (language) {
      where.languageId = language.id;
    }
  }

  return prisma.contentTranslation.findMany({
    where,
    include: { language: true },
    orderBy: { field: 'asc' },
  });
}

export async function deleteContentTranslation(
  entityType: ContentEntityType,
  entityId: string,
  field: string,
  languageCode: string,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  return prisma.contentTranslation.delete({
    where: {
      entityType_entityId_field_languageId: {
        entityType,
        entityId,
        field,
        languageId: language.id,
      },
    },
  });
}

export async function deleteAllContentTranslations(
  entityType: ContentEntityType,
  entityId: string,
) {
  return prisma.contentTranslation.deleteMany({
    where: { entityType, entityId },
  });
}

// ============================================
// Get Translated Content
// ============================================

export async function getTranslatedFields<T extends Record<string, any>>(
  entity: T,
  entityType: ContentEntityType,
  entityId: string,
  fields: string[],
  languageCode: string,
): Promise<T> {
  const result = { ...entity };
  const defaultLang = await languageService.getDefaultLanguage();

  for (const field of fields) {
    // Try requested language
    let translation = await getContentTranslation(entityType, entityId, field, languageCode);

    // Fallback to default language
    if (!translation && languageCode !== defaultLang.code) {
      translation = await getContentTranslation(entityType, entityId, field, defaultLang.code);
    }

    if (translation?.value) {
      (result as any)[field] = translation.value;
    }
  }

  return result;
}

export async function translateEntity<T extends { id: string }>(
  entity: T,
  entityType: ContentEntityType,
  translatableFields: string[],
  languageCode: string,
): Promise<T & { _translations?: Record<string, string> }> {
  const translations = await getContentTranslations(entityType, entity.id, languageCode);

  const result = { ...entity, _translations: {} as Record<string, string> };

  for (const t of translations) {
    if (translatableFields.includes(t.field)) {
      (result as any)[t.field] = t.value;
      result._translations[t.field] = t.value;
    }
  }

  return result;
}

export async function translateEntities<T extends { id: string }>(
  entities: T[],
  entityType: ContentEntityType,
  translatableFields: string[],
  languageCode: string,
): Promise<T[]> {
  return Promise.all(
    entities.map((entity) =>
      translateEntity(entity, entityType, translatableFields, languageCode),
    ),
  );
}

// ============================================
// Translation Status Management
// ============================================

export async function updateContentTranslationStatus(
  entityType: ContentEntityType,
  entityId: string,
  field: string,
  languageCode: string,
  status: TranslationStatus,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  return prisma.contentTranslation.update({
    where: {
      entityType_entityId_field_languageId: {
        entityType,
        entityId,
        field,
        languageId: language.id,
      },
    },
    data: { status },
  });
}

export async function verifyContentTranslation(
  entityType: ContentEntityType,
  entityId: string,
  field: string,
  languageCode: string,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  return prisma.contentTranslation.update({
    where: {
      entityType_entityId_field_languageId: {
        entityType,
        entityId,
        field,
        languageId: language.id,
      },
    },
    data: {
      isVerified: true,
      status: 'APPROVED',
    },
  });
}

// ============================================
// Bulk Operations
// ============================================

export async function setMultipleContentTranslations(
  entityType: ContentEntityType,
  entityId: string,
  translations: Array<{
    field: string;
    languageCode: string;
    value: string;
    isMachineTranslated?: boolean;
  }>,
) {
  const results = [];

  for (const t of translations) {
    try {
      const result = await setContentTranslation(
        entityType,
        entityId,
        t.field,
        t.languageCode,
        t.value,
        { isMachineTranslated: t.isMachineTranslated },
      );
      results.push({ success: true, translation: result });
    } catch (error) {
      results.push({ success: false, error: (error as Error).message, ...t });
    }
  }

  return results;
}

export async function copyTranslations(
  sourceEntityType: ContentEntityType,
  sourceEntityId: string,
  targetEntityType: ContentEntityType,
  targetEntityId: string,
) {
  const sourceTranslations = await prisma.contentTranslation.findMany({
    where: { entityType: sourceEntityType, entityId: sourceEntityId },
  });

  const results = [];

  for (const t of sourceTranslations) {
    try {
      const result = await prisma.contentTranslation.create({
        data: {
          entityType: targetEntityType,
          entityId: targetEntityId,
          field: t.field,
          languageId: t.languageId,
          value: t.value,
          status: 'DRAFT',
          isMachineTranslated: t.isMachineTranslated,
          originalLanguageId: t.originalLanguageId,
        },
      });
      results.push({ success: true, translation: result });
    } catch (error) {
      results.push({ success: false, error: (error as Error).message });
    }
  }

  return results;
}

// ============================================
// Translation Progress for Content
// ============================================

export async function getContentTranslationProgress(
  entityType: ContentEntityType,
  entityId: string,
  requiredFields: string[],
) {
  const languages = await languageService.getLanguages();
  const translations = await getContentTranslations(entityType, entityId);

  const progress = languages.map((lang) => {
    const langTranslations = translations.filter((t) => t.languageId === lang.id);
    const translatedFields = langTranslations.map((t) => t.field);
    const missingFields = requiredFields.filter((f) => !translatedFields.includes(f));

    return {
      language: lang,
      totalFields: requiredFields.length,
      translated: translatedFields.length,
      missing: missingFields,
      progress:
        requiredFields.length > 0
          ? Math.round((translatedFields.length / requiredFields.length) * 100)
          : 100,
    };
  });

  return progress;
}

export async function getUntranslatedContent(
  entityType: ContentEntityType,
  languageCode: string,
  limit = 50,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  // Get default language translations as reference
  const defaultLang = await languageService.getDefaultLanguage();

  // Find content that has default language translation but missing target language
  const defaultTranslations = await prisma.contentTranslation.findMany({
    where: {
      entityType,
      languageId: defaultLang.id,
    },
    select: { entityId: true, field: true },
    take: limit * 10,
  });

  const targetTranslations = await prisma.contentTranslation.findMany({
    where: {
      entityType,
      languageId: language.id,
    },
    select: { entityId: true, field: true },
  });

  const targetSet = new Set(
    targetTranslations.map((t) => `${t.entityId}:${t.field}`),
  );

  const missing = defaultTranslations
    .filter((t) => !targetSet.has(`${t.entityId}:${t.field}`))
    .slice(0, limit);

  return missing;
}

// ============================================
// Translation Memory
// ============================================

export async function addToTranslationMemory(
  sourceLanguageCode: string,
  targetLanguageCode: string,
  sourceText: string,
  targetText: string,
  namespace?: string,
  context?: string,
) {
  const sourceLang = await languageService.getLanguageByCode(sourceLanguageCode);
  const targetLang = await languageService.getLanguageByCode(targetLanguageCode);

  if (!sourceLang || !targetLang) {
    throw new Error('Invalid language code');
  }

  return prisma.translationMemory.upsert({
    where: {
      sourceLanguageId_targetLanguageId_sourceText: {
        sourceLanguageId: sourceLang.id,
        targetLanguageId: targetLang.id,
        sourceText,
      },
    },
    create: {
      sourceLanguageId: sourceLang.id,
      targetLanguageId: targetLang.id,
      sourceText,
      targetText,
      namespace,
      context,
    },
    update: {
      targetText,
      usageCount: { increment: 1 },
    },
  });
}

export async function findInTranslationMemory(
  sourceLanguageCode: string,
  targetLanguageCode: string,
  sourceText: string,
) {
  const sourceLang = await languageService.getLanguageByCode(sourceLanguageCode);
  const targetLang = await languageService.getLanguageByCode(targetLanguageCode);

  if (!sourceLang || !targetLang) {
    return null;
  }

  return prisma.translationMemory.findUnique({
    where: {
      sourceLanguageId_targetLanguageId_sourceText: {
        sourceLanguageId: sourceLang.id,
        targetLanguageId: targetLang.id,
        sourceText,
      },
    },
  });
}

export async function searchTranslationMemory(
  sourceLanguageCode: string,
  targetLanguageCode: string,
  searchText: string,
  limit = 10,
) {
  const sourceLang = await languageService.getLanguageByCode(sourceLanguageCode);
  const targetLang = await languageService.getLanguageByCode(targetLanguageCode);

  if (!sourceLang || !targetLang) {
    return [];
  }

  return prisma.translationMemory.findMany({
    where: {
      sourceLanguageId: sourceLang.id,
      targetLanguageId: targetLang.id,
      sourceText: { contains: searchText, mode: 'insensitive' },
    },
    orderBy: { usageCount: 'desc' },
    take: limit,
  });
}
