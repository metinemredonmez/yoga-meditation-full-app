import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import * as i18nController from '../controllers/i18nController';
import {
  createLanguageBodySchema,
  updateLanguageBodySchema,
  createTranslationKeyBodySchema,
  updateTranslationKeyBodySchema,
  setTranslationBodySchema,
  updateTranslationStatusBodySchema,
  setContentTranslationBodySchema,
  setMultipleContentTranslationsBodySchema,
  importTranslationsBodySchema,
  translationKeysQuerySchema,
  languagesQuerySchema,
  untranslatedContentQuerySchema,
  contentProgressQuerySchema,
} from '../validation/i18nSchemas';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ============================================
// Language Management
// ============================================

// Get all languages (including inactive)
router.get(
  '/languages',
  validateQuery(languagesQuerySchema),
  i18nController.adminGetLanguages,
);

// Create language
router.post(
  '/languages',
  validateBody(createLanguageBodySchema),
  i18nController.createLanguage,
);

// Update language
router.put(
  '/languages/:id',
  validateBody(updateLanguageBodySchema),
  i18nController.updateLanguage,
);

// Delete language
router.delete('/languages/:id', i18nController.deleteLanguage);

// Seed default languages
router.post('/languages/seed', i18nController.seedLanguages);

// ============================================
// Translation Key Management
// ============================================

// Get all translation keys
router.get(
  '/keys',
  validateQuery(translationKeysQuerySchema),
  i18nController.getTranslationKeys,
);

// Create translation key
router.post(
  '/keys',
  validateBody(createTranslationKeyBodySchema),
  i18nController.createTranslationKey,
);

// Update translation key
router.put(
  '/keys/:id',
  validateBody(updateTranslationKeyBodySchema),
  i18nController.updateTranslationKey,
);

// Delete translation key
router.delete('/keys/:id', i18nController.deleteTranslationKey);

// ============================================
// Translation Management
// ============================================

// Set translation for a key in a language
router.put(
  '/translations/:keyId/:languageId',
  validateBody(setTranslationBodySchema),
  i18nController.setTranslation,
);

// Verify translation
router.post(
  '/translations/:keyId/:languageId/verify',
  i18nController.verifyTranslation,
);

// Update translation status
router.patch(
  '/translations/:keyId/:languageId/status',
  validateBody(updateTranslationStatusBodySchema),
  i18nController.updateTranslationStatus,
);

// Delete translation
router.delete(
  '/translations/:keyId/:languageId',
  i18nController.deleteTranslation,
);

// ============================================
// Content Translation Management
// ============================================

// Set content translation
router.put(
  '/content/:entityType/:entityId/:field/:languageCode',
  validateBody(setContentTranslationBodySchema),
  i18nController.setContentTranslation,
);

// Delete content translation
router.delete(
  '/content/:entityType/:entityId/:field/:languageCode',
  i18nController.deleteContentTranslation,
);

// Set multiple content translations at once
router.post(
  '/content/:entityType/:entityId/batch',
  validateBody(setMultipleContentTranslationsBodySchema),
  i18nController.setMultipleContentTranslations,
);

// ============================================
// Import/Export
// ============================================

// Import translations from JSON
router.post(
  '/import',
  validateBody(importTranslationsBodySchema),
  i18nController.importTranslations,
);

// Export translations for a language
router.get('/export/:languageCode', i18nController.exportTranslations);

// Publish all pending translations for a language
router.post('/publish/:languageId', i18nController.publishTranslations);

// Seed translations from locale files
router.post('/seed-translations', i18nController.seedTranslationsFromFiles);

// Sync translations (import from files, export to files)
router.post('/sync', i18nController.syncTranslations);

// ============================================
// Progress & Stats
// ============================================

// Get overall translation progress
router.get('/progress', i18nController.getTranslationProgress);

// Get missing translations for a language
router.get('/missing/:languageId', i18nController.getMissingTranslations);

// Get content translation progress
router.get(
  '/content-progress/:entityType/:entityId',
  validateQuery(contentProgressQuerySchema),
  i18nController.getContentTranslationProgress,
);

// Get untranslated content for a language
router.get(
  '/untranslated/:entityType/:languageCode',
  validateQuery(untranslatedContentQuerySchema),
  i18nController.getUntranslatedContent,
);

export default router;
