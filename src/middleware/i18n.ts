import { Request, Response, NextFunction } from 'express';
import * as languageService from '../services/languageService';
import * as translationService from '../services/translationService';
import { logger } from '../utils/logger';

// Extend Express Request to include i18n
declare global {
  namespace Express {
    interface Request {
      language: string;
      languageId?: string;
      t: (key: string, params?: Record<string, string | number>, count?: number) => Promise<string>;
    }
  }
}

/**
 * i18n Middleware - Resolves user language preference
 *
 * Language resolution order:
 * 1. Query parameter: ?lang=tr
 * 2. User preference (if authenticated)
 * 3. Accept-Language header
 * 4. Default language (en)
 */
export async function i18nMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const queryLang = req.query.lang as string | undefined;
    const acceptLanguage = req.headers['accept-language'];
    const userId = req.user?.id;

    const languageCode = await languageService.resolveLanguage(
      userId,
      acceptLanguage,
      queryLang,
    );

    req.language = languageCode;

    // Get language ID for database operations
    const language = await languageService.getLanguageByCode(languageCode);
    if (language) {
      req.languageId = language.id;
    }

    // Add translation function to request
    req.t = async (
      key: string,
      params?: Record<string, string | number>,
      count?: number,
    ) => {
      return translationService.translate(key, languageCode, params, count);
    };

    // Set language in response header
    res.setHeader('Content-Language', languageCode);

    next();
  } catch (error) {
    logger.error({ error }, 'i18n middleware error');
    // Set default language on error
    req.language = 'en';
    req.t = async (key: string) => key;
    next();
  }
}

/**
 * Require specific language middleware
 * Use when you need to enforce a specific language for a route
 */
export function requireLanguage(allowedLanguages: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await i18nMiddleware(req, res, () => {});

    if (!allowedLanguages.includes(req.language)) {
      return res.status(406).json({
        error: 'Language not supported',
        supportedLanguages: allowedLanguages,
        currentLanguage: req.language,
      });
    }

    next();
  };
}

/**
 * Optional i18n - doesn't fail if language resolution fails
 */
export async function optionalI18n(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await i18nMiddleware(req, res, next);
  } catch {
    req.language = 'en';
    req.t = async (key: string) => key;
    next();
  }
}

/**
 * Helper to get translated response messages
 */
export function translatedResponse(
  res: Response,
  status: number,
  data: Record<string, any>,
) {
  return res.status(status).json({
    ...data,
    _language: (res.req as Request).language,
  });
}

/**
 * Middleware to detect and save user's preferred language from browser
 */
export async function detectAndSaveLanguage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user?.id && req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      const detectedLocale = acceptLanguage.split(',')[0]?.split('-')[0];

      if (detectedLocale) {
        // Check if this is a new detection (first time or changed)
        const currentPref = await languageService.getUserLanguagePreference(
          req.user.id,
        );

        if (
          currentPref.autoDetect &&
          (!('detectedLocale' in currentPref) ||
            currentPref.detectedLocale !== detectedLocale)
        ) {
          await languageService.setUserLanguagePreference(
            req.user.id,
            detectedLocale,
            true,
            detectedLocale,
          );
        }
      }
    }
  } catch (error) {
    // Non-critical, just log
    logger.debug({ error }, 'Failed to detect/save language preference');
  }

  next();
}

/**
 * Create a t function for use outside of request context
 */
export function createTranslator(languageCode: string) {
  return async (
    key: string,
    params?: Record<string, string | number>,
    count?: number,
  ) => {
    return translationService.translate(key, languageCode, params, count);
  };
}

/**
 * Get all translations for client-side use
 */
export async function getClientTranslations(languageCode: string, namespaces?: string[]) {
  if (namespaces && namespaces.length > 0) {
    const translations: Record<string, Record<string, string>> = {};
    for (const ns of namespaces) {
      translations[ns] = await translationService.getTranslationsForLanguage(
        languageCode,
        ns,
      );
    }
    return translations;
  }

  return translationService.getTranslationsByNamespace(languageCode);
}
