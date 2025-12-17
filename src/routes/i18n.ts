import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { i18nMiddleware } from '../middleware/i18n';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import * as i18nController from '../controllers/i18nController';
import {
  translationsQuerySchema,
  translateBodySchema,
  translateBatchBodySchema,
  setUserLanguagePreferenceBodySchema,
} from '../validation/i18nSchemas';

const router = Router();

// Apply i18n middleware to all routes
router.use(i18nMiddleware);

// ============================================
// Language Routes (Public)
// ============================================

// Get all active languages
router.get('/languages', i18nController.getLanguages);

// Get language by code
router.get('/languages/:code', i18nController.getLanguageByCode);

// ============================================
// Translation Routes (Public)
// ============================================

// Get translations for a language
router.get(
  '/translations',
  validateQuery(translationsQuerySchema),
  i18nController.getTranslations,
);

// Translate a single key
router.post(
  '/translate',
  optionalAuth,
  validateBody(translateBodySchema),
  i18nController.translate,
);

// Translate multiple keys at once
router.post(
  '/translate/batch',
  optionalAuth,
  validateBody(translateBatchBodySchema),
  i18nController.translateBatch,
);

// ============================================
// Content Translation Routes (Public)
// ============================================

// Get translation for specific content field
router.get(
  '/content/:entityType/:entityId/:field',
  i18nController.getContentTranslation,
);

// Get all translations for content
router.get(
  '/content/:entityType/:entityId',
  i18nController.getContentTranslations,
);

// ============================================
// User Language Preference (Authenticated)
// ============================================

// Get user's language preference
router.get(
  '/preference',
  authenticate,
  i18nController.getUserLanguagePreference,
);

// Set user's language preference
router.put(
  '/preference',
  authenticate,
  validateBody(setUserLanguagePreferenceBodySchema),
  i18nController.setUserLanguagePreference,
);

export default router;
