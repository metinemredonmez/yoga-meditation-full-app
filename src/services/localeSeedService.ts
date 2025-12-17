import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as languageService from './languageService';
import * as translationService from './translationService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Seeds the database with translations from locale JSON files
 */
export async function seedTranslationsFromFiles() {
  const localesDir = path.join(__dirname, '../locales');

  // Check if locales directory exists
  if (!fs.existsSync(localesDir)) {
    logger.warn('Locales directory not found, skipping translation seeding');
    return;
  }

  // First, seed languages
  await languageService.seedDefaultLanguages();

  // Get all JSON files in locales directory
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const languageCode = path.basename(file, '.json');
    const filePath = path.join(localesDir, file);

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      await seedTranslationsForLanguage(languageCode, content);
      logger.info({ languageCode, file }, 'Translations seeded from file');
    } catch (error) {
      logger.error({ error, file }, 'Failed to seed translations from file');
    }
  }

  // Publish all seeded translations
  const languages = await languageService.getLanguages();
  for (const lang of languages) {
    await translationService.publishAllPendingTranslations(lang.id);
  }

  logger.info('All translations seeded and published');
}

async function seedTranslationsForLanguage(
  languageCode: string,
  content: Record<string, Record<string, string>>,
) {
  const language = await languageService.getLanguageByCode(languageCode);
  if (!language) {
    logger.warn({ languageCode }, 'Language not found, skipping');
    return;
  }

  let keysCreated = 0;
  let translationsSet = 0;

  for (const [namespace, translations] of Object.entries(content)) {
    for (const [keyName, value] of Object.entries(translations)) {
      const fullKey = `${namespace}.${keyName}`;

      // Ensure translation key exists
      let translationKey = await prisma.translationKey.findUnique({
        where: { key: fullKey },
      });

      if (!translationKey) {
        translationKey = await prisma.translationKey.create({
          data: {
            key: fullKey,
            namespace,
          },
        });
        keysCreated++;
      }

      // Set translation
      await prisma.translation.upsert({
        where: {
          keyId_languageId: {
            keyId: translationKey.id,
            languageId: language.id,
          },
        },
        create: {
          keyId: translationKey.id,
          languageId: language.id,
          value,
          status: 'PUBLISHED',
        },
        update: {
          value,
          status: 'PUBLISHED',
        },
      });
      translationsSet++;
    }
  }

  logger.info(
    { languageCode, keysCreated, translationsSet },
    'Translations seeded for language',
  );
}

/**
 * Export translations to locale files
 */
export async function exportTranslationsToFiles() {
  const localesDir = path.join(__dirname, '../locales');

  // Ensure directory exists
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
  }

  const languages = await languageService.getLanguages();

  for (const lang of languages) {
    const translations = await translationService.getTranslationsByNamespace(lang.code);

    if (Object.keys(translations).length > 0) {
      const filePath = path.join(localesDir, `${lang.code}.json`);
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));
      logger.info({ languageCode: lang.code, filePath }, 'Translations exported to file');
    }
  }
}

/**
 * Sync translations between database and files
 * Priority: Database -> Files (database is source of truth)
 */
export async function syncTranslations() {
  // First import any new translations from files
  await seedTranslationsFromFiles();

  // Then export database translations back to files
  await exportTranslationsToFiles();

  logger.info('Translations synced');
}
