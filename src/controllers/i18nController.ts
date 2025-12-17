import { Request, Response, NextFunction } from 'express';
import * as languageService from '../services/languageService';
import * as translationService from '../services/translationService';
import * as contentTranslationService from '../services/contentTranslationService';
import * as localeSeedService from '../services/localeSeedService';
import { getClientTranslations } from '../middleware/i18n';
import { HttpError } from '../middleware/errorHandler';
import { ContentEntityType, TranslationStatus } from '@prisma/client';

// ============================================
// Language Routes (Public)
// ============================================

export async function getLanguages(req: Request, res: Response, next: NextFunction) {
  try {
    const languages = await languageService.getLanguages();

    res.json({
      success: true,
      languages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLanguageByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code!;
    const language = await languageService.getLanguageByCode(code);

    if (!language) {
      throw new HttpError(404, 'Language not found');
    }

    res.json({
      success: true,
      language,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Translation Routes (Public)
// ============================================

export async function getTranslations(req: Request, res: Response, next: NextFunction) {
  try {
    const lang = (req.query.lang as string) || req.language;
    const namespace = req.query.namespace as string | undefined;
    const namespaces = req.query.namespaces as string | undefined;

    let translations;
    if (namespaces) {
      translations = await getClientTranslations(
        lang,
        namespaces.split(','),
      );
    } else {
      translations = await translationService.getTranslationsForLanguage(
        lang,
        namespace,
      );
    }

    res.json({
      success: true,
      language: lang,
      translations,
    });
  } catch (error) {
    next(error);
  }
}

export async function translate(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, params, count } = req.body;
    const lang = (req.query.lang as string) || req.language;

    const translation = await translationService.translate(key, lang, params, count);

    res.json({
      success: true,
      key,
      value: translation,
      language: lang,
    });
  } catch (error) {
    next(error);
  }
}

export async function translateBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { keys, params } = req.body;
    const lang = (req.query.lang as string) || req.language;

    const translations: Record<string, string> = {};
    for (const key of keys) {
      translations[key] = await translationService.translate(
        key,
        lang,
        params?.[key],
      );
    }

    res.json({
      success: true,
      translations,
      language: lang,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User Language Preference (Authenticated)
// ============================================

export async function getUserLanguagePreference(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const preference = await languageService.getUserLanguagePreference(userId);

    res.json({
      success: true,
      preference,
    });
  } catch (error) {
    next(error);
  }
}

export async function setUserLanguagePreference(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { languageCode, autoDetect } = req.body;

    const preference = await languageService.setUserLanguagePreference(
      userId,
      languageCode,
      autoDetect,
    );

    res.json({
      success: true,
      preference,
      message: 'Language preference updated',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Content Translation (Public - for content consumers)
// ============================================

export async function getContentTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const field = req.params.field!;
    const lang = (req.query.lang as string) || req.language;

    const translation = await contentTranslationService.getContentTranslation(
      entityType as ContentEntityType,
      entityId,
      field,
      lang,
    );

    res.json({
      success: true,
      translation: translation?.value || null,
      language: lang,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContentTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const lang = (req.query.lang as string) || req.language;

    const translations = await contentTranslationService.getContentTranslations(
      entityType as ContentEntityType,
      entityId,
      lang,
    );

    const result: Record<string, string> = {};
    for (const t of translations) {
      result[t.field] = t.value;
    }

    res.json({
      success: true,
      entityType,
      entityId,
      language: lang,
      translations: result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Language Management
// ============================================

export async function adminGetLanguages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const languages = await languageService.getLanguages(includeInactive);

    res.json({
      success: true,
      languages,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLanguage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const language = await languageService.createLanguage(req.body);

    res.status(201).json({
      success: true,
      language,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLanguage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const language = await languageService.updateLanguage(id, req.body);

    res.json({
      success: true,
      language,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLanguage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    await languageService.deleteLanguage(id);

    res.json({
      success: true,
      message: 'Language deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function seedLanguages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await languageService.seedDefaultLanguages();

    res.json({
      success: true,
      message: 'Languages seeded',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Translation Key Management
// ============================================

export async function getTranslationKeys(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const namespace = req.query.namespace as string | undefined;
    const keys = await translationService.getTranslationKeys(namespace);

    res.json({
      success: true,
      keys,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTranslationKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const key = await translationService.createTranslationKey(req.body);

    res.status(201).json({
      success: true,
      key,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTranslationKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const key = await translationService.updateTranslationKey(id, req.body);

    res.json({
      success: true,
      key,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTranslationKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    await translationService.deleteTranslationKey(id);

    res.json({
      success: true,
      message: 'Translation key deleted',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Translation Management
// ============================================

export async function setTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const keyId = req.params.keyId!;
    const languageId = req.params.languageId!;
    const { value, pluralOne, pluralOther, pluralZero, status, isMachineTranslated } =
      req.body;

    const translation = await translationService.setTranslation(
      keyId,
      languageId,
      value,
      { pluralOne, pluralOther, pluralZero, status, isMachineTranslated },
    );

    res.json({
      success: true,
      translation,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const keyId = req.params.keyId!;
    const languageId = req.params.languageId!;
    const userId = req.user!.id;

    const translation = await translationService.verifyTranslation(
      keyId,
      languageId,
      userId,
    );

    res.json({
      success: true,
      translation,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTranslationStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const keyId = req.params.keyId!;
    const languageId = req.params.languageId!;
    const { status } = req.body;

    const translation = await translationService.updateTranslationStatus(
      keyId,
      languageId,
      status as TranslationStatus,
    );

    res.json({
      success: true,
      translation,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const keyId = req.params.keyId!;
    const languageId = req.params.languageId!;
    await translationService.deleteTranslation(keyId, languageId);

    res.json({
      success: true,
      message: 'Translation deleted',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Content Translation Management
// ============================================

export async function setContentTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const field = req.params.field!;
    const languageCode = req.params.languageCode!;
    const { value, status, isMachineTranslated, originalLanguageCode } = req.body;

    const translation = await contentTranslationService.setContentTranslation(
      entityType as ContentEntityType,
      entityId,
      field,
      languageCode,
      value,
      { status, isMachineTranslated, originalLanguageCode },
    );

    res.json({
      success: true,
      translation,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteContentTranslation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const field = req.params.field!;
    const languageCode = req.params.languageCode!;

    await contentTranslationService.deleteContentTranslation(
      entityType as ContentEntityType,
      entityId,
      field,
      languageCode,
    );

    res.json({
      success: true,
      message: 'Content translation deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function setMultipleContentTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const { translations } = req.body;

    const results = await contentTranslationService.setMultipleContentTranslations(
      entityType as ContentEntityType,
      entityId,
      translations,
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Import/Export
// ============================================

export async function importTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { languageCode, translations, namespace } = req.body;

    const results = await translationService.importTranslations(
      languageCode,
      translations,
      namespace,
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const languageCode = req.params.languageCode!;
    const namespace = req.query.namespace as string | undefined;

    const translations = await translationService.exportTranslations(
      languageCode,
      namespace,
    );

    res.json({
      success: true,
      languageCode,
      namespace,
      translations,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const languageId = req.params.languageId!;

    const result = await translationService.publishAllPendingTranslations(languageId);

    res.json({
      success: true,
      message: 'Translations published',
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Progress & Stats
// ============================================

export async function getTranslationProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const progress = await translationService.getTranslationProgress();

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMissingTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const languageId = req.params.languageId!;
    const missing = await translationService.getMissingTranslations(languageId);

    res.json({
      success: true,
      missing,
      count: missing.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContentTranslationProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const requiredFields = (req.query.fields as string || '').split(',').filter(Boolean);

    const progress = await contentTranslationService.getContentTranslationProgress(
      entityType as ContentEntityType,
      entityId,
      requiredFields,
    );

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUntranslatedContent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const entityType = req.params.entityType!;
    const languageCode = req.params.languageCode!;
    const limit = parseInt(req.query.limit as string) || 50;

    const untranslated = await contentTranslationService.getUntranslatedContent(
      entityType as ContentEntityType,
      languageCode,
      limit,
    );

    res.json({
      success: true,
      untranslated,
      count: untranslated.length,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Seed Translations from Files
// ============================================

export async function seedTranslationsFromFiles(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await localeSeedService.seedTranslationsFromFiles();

    res.json({
      success: true,
      message: 'Translations seeded from locale files',
    });
  } catch (error) {
    next(error);
  }
}

export async function syncTranslations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await localeSeedService.syncTranslations();

    res.json({
      success: true,
      message: 'Translations synced',
    });
  } catch (error) {
    next(error);
  }
}
