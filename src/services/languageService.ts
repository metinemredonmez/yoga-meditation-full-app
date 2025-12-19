import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { LanguageDirection } from '@prisma/client';

// ============================================
// Language Management
// ============================================

export async function getLanguages(includeInactive = false) {
  return prisma.languages.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function getLanguageByCode(code: string) {
  return prisma.languages.findUnique({
    where: { code },
  });
}

export async function getLanguageById(id: string) {
  return prisma.languages.findUnique({
    where: { id },
  });
}

export async function getDefaultLanguage() {
  const defaultLang = await prisma.languages.findFirst({
    where: { isDefault: true, isActive: true },
  });

  if (!defaultLang) {
    // Return English as fallback or create it
    let english = await prisma.languages.findUnique({ where: { code: 'en' } });
    if (!english) {
      english = await createLanguage({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        isDefault: true,
        flagEmoji: '🇺🇸',
      });
    }
    return english;
  }

  return defaultLang;
}

export async function createLanguage(data: {
  code: string;
  name: string;
  nativeName: string;
  direction?: LanguageDirection;
  isDefault?: boolean;
  isActive?: boolean;
  flagEmoji?: string;
  flagUrl?: string;
  fallbackId?: string;
}) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.languages.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const language = await prisma.languages.create({
    data,
  });

  logger.info({ code: data.code }, 'Language created');
  return language;
}

export async function updateLanguage(
  id: string,
  data: Partial<{
    name: string;
    nativeName: string;
    direction: LanguageDirection;
    isDefault: boolean;
    isActive: boolean;
    flagEmoji: string;
    flagUrl: string;
    fallbackId: string;
  }>,
) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.languages.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.languages.update({
    where: { id },
    data,
  });
}

export async function deleteLanguage(id: string) {
  const language = await prisma.languages.findUnique({ where: { id } });

  if (!language) {
    throw new Error('Language not found');
  }

  if (language.isDefault) {
    throw new Error('Cannot delete default language');
  }

  // Delete all translations for this language
  await prisma.translations.deleteMany({ where: { languageId: id } });
  await prisma.content_translations.deleteMany({ where: { languageId: id } });

  return prisma.languages.delete({ where: { id } });
}

// ============================================
// User Language Preferences
// ============================================

export async function getUserLanguagePreference(userId: string) {
  const pref = await prisma.user_language_preferences.findUnique({
    where: { userId },
    include: { languages: true },
  });

  if (!pref) {
    const defaultLang = await getDefaultLanguage();
    return {
      preferredLanguage: defaultLang,
      autoDetect: true,
    };
  }

  return {
    ...pref,
    preferredLanguage: pref.languages,
  };
}

export async function setUserLanguagePreference(
  userId: string,
  languageCode: string,
  autoDetect = true,
  detectedLocale?: string,
) {
  const language = await getLanguageByCode(languageCode);
  if (!language) {
    throw new Error(`Language ${languageCode} not found`);
  }

  const result = await prisma.user_language_preferences.upsert({
    where: { userId },
    create: {
      userId,
      preferredLanguageId: language.id,
      autoDetect,
      detectedLocale,
    },
    update: {
      preferredLanguageId: language.id,
      autoDetect,
      detectedLocale,
    },
    include: { languages: true },
  });

  return {
    ...result,
    preferredLanguage: result.languages,
  };
}

// ============================================
// Resolve Language
// ============================================

export async function resolveLanguage(
  userId?: string,
  acceptLanguage?: string,
  queryLang?: string,
): Promise<string> {
  // 1. Query parameter takes highest priority
  if (queryLang) {
    const lang = await getLanguageByCode(queryLang);
    if (lang?.isActive) return lang.code;
  }

  // 2. User preference
  if (userId) {
    const pref = await getUserLanguagePreference(userId);
    if (pref && 'preferredLanguage' in pref && pref.preferredLanguage?.isActive) {
      return pref.preferredLanguage.code;
    }
  }

  // 3. Accept-Language header
  if (acceptLanguage) {
    const parsed = parseAcceptLanguage(acceptLanguage);
    for (const code of parsed) {
      const lang = await getLanguageByCode(code);
      if (lang?.isActive) return lang.code;
    }
  }

  // 4. Default language
  const defaultLang = await getDefaultLanguage();
  return defaultLang.code;
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const parts = part.trim().split(';');
      const rawCode = parts[0] || 'en';
      const qPart = parts[1];
      const q = qPart ? parseFloat(qPart.split('=')[1] || '1') : 1;
      const langCode = rawCode.split('-')[0] || 'en';
      return { code: langCode.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.code);
}

// ============================================
// Seed Default Languages
// ============================================

export async function seedDefaultLanguages() {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇺🇸', isDefault: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flagEmoji: '🇹🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪' },
    { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flagEmoji: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦', direction: 'RTL' as const },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳' },
  ];

  for (const lang of languages) {
    await prisma.languages.upsert({
      where: { code: lang.code },
      create: lang,
      update: {},
    });
  }

  logger.info('Default languages seeded');
}
