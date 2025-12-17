import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

interface TemplateVariables {
  [key: string]: string | number | boolean | object | undefined;
}

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// Template Cache
// ============================================

const templateCache = new Map<string, string>();
const TEMPLATES_DIR = join(__dirname, '../templates/emails');

// ============================================
// Template Functions
// ============================================

/**
 * Load template from file system
 */
function loadTemplate(templateName: string): string {
  const cacheKey = templateName;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  try {
    const templatePath = join(TEMPLATES_DIR, `${templateName}.html`);
    const template = readFileSync(templatePath, 'utf-8');
    templateCache.set(cacheKey, template);
    return template;
  } catch (error) {
    logger.error({ templateName, error }, 'Failed to load email template');
    throw new Error(`Template not found: ${templateName}`);
  }
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  logger.info('Email template cache cleared');
}

/**
 * List available templates
 */
export function listTemplates(): string[] {
  try {
    const files = readdirSync(TEMPLATES_DIR);
    return files
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace('.html', ''));
  } catch {
    return [];
  }
}

/**
 * Compile template with variables
 */
function compileTemplate(template: string, variables: TemplateVariables): string {
  let compiled = template;

  // Replace simple variables {{variable}}
  compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });

  // Handle conditionals {{#if variable}}...{{/if}}
  compiled = compiled.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = variables[key];
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      return content;
    }
    return '';
  });

  // Handle loops {{#each array}}...{{/each}}
  compiled = compiled.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
    const array = variables[key];
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      let itemContent = content;
      if (typeof item === 'object') {
        Object.entries(item).forEach(([k, v]) => {
          const regex = new RegExp(`\\{\\{this\\.${k}\\}\\}`, 'g');
          itemContent = itemContent.replace(regex, String(v ?? ''));
        });
      } else {
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
      }
      return itemContent;
    }).join('');
  });

  return compiled;
}

/**
 * Generate plain text version from HTML
 */
function htmlToText(html: string): string {
  return html
    // Remove style and script tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Replace line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// ============================================
// Default Variables
// ============================================

function getDefaultVariables(): TemplateVariables {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';
  const cdnUrl = process.env.CDN_URL || 'https://cdn.yogaapp.com';

  return {
    // URLs
    logoUrl: `${cdnUrl}/images/logo.png`,
    instagramUrl: 'https://instagram.com/yogaapp',
    facebookUrl: 'https://facebook.com/yogaapp',
    twitterUrl: 'https://twitter.com/yogaapp',
    youtubeUrl: 'https://youtube.com/yogaapp',
    instagramIcon: `${cdnUrl}/images/icons/instagram.png`,
    facebookIcon: `${cdnUrl}/images/icons/facebook.png`,
    twitterIcon: `${cdnUrl}/images/icons/twitter.png`,
    youtubeIcon: `${cdnUrl}/images/icons/youtube.png`,
    privacyUrl: `${baseUrl}/privacy`,
    unsubscribeUrl: `${baseUrl}/unsubscribe`,

    // Company info
    companyName: 'Yoga App',
    companyAddress: 'Istanbul, Turkey',
    supportEmail: 'destek@yogaapp.com',
    year: new Date().getFullYear(),

    // Icons
    lockIcon: `${cdnUrl}/images/icons/lock.png`,
    classesIcon: `${cdnUrl}/images/icons/classes.png`,
    instructorsIcon: `${cdnUrl}/images/icons/instructors.png`,
    programsIcon: `${cdnUrl}/images/icons/programs.png`,
    liveIcon: `${cdnUrl}/images/icons/live.png`,
  };
}

// ============================================
// Template Renderers
// ============================================

export function renderTemplate(
  templateName: string,
  variables: TemplateVariables
): EmailTemplate {
  const template = loadTemplate(templateName);
  const mergedVariables = { ...getDefaultVariables(), ...variables };
  const html = compileTemplate(template, mergedVariables);
  const text = htmlToText(html);

  return {
    name: templateName,
    subject: getSubjectForTemplate(templateName, mergedVariables),
    html,
    text,
  };
}

function getSubjectForTemplate(templateName: string, variables: TemplateVariables): string {
  const subjects: Record<string, string> = {
    'welcome': `Hoş Geldiniz ${variables.firstName}! 🧘`,
    'password-reset': 'Şifre Sıfırlama Talebi',
    'payment-success': 'Ödemeniz Alındı ✅',
    'booking-confirmation': `Rezervasyon Onayı: ${variables.className}`,
    'class-reminder': `Hatırlatma: ${variables.className} başlıyor! ⏰`,
    'subscription-expiring': 'Aboneliğiniz Sona Eriyor ⚠️',
    'weekly-digest': `Haftalık Özetiniz - ${variables.weekRange}`,
  };

  return subjects[templateName] || 'Yoga App';
}

// ============================================
// Specific Template Helpers
// ============================================

export function renderWelcomeEmail(data: {
  firstName: string;
  email: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('welcome', {
    ...data,
    exploreUrl: `${baseUrl}/classes`,
    headerTitle: 'Yoga App\'e Hoş Geldiniz!',
  });
}

export function renderPasswordResetEmail(data: {
  firstName: string;
  email: string;
  resetToken: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('password-reset', {
    ...data,
    resetUrl: `${baseUrl}/reset-password?token=${data.resetToken}`,
    expireTime: '1 saat',
  });
}

export function renderPaymentSuccessEmail(data: {
  firstName: string;
  invoiceNumber: string;
  productName: string;
  billingPeriod: string;
  paymentDate: string;
  paymentMethod: string;
  totalAmount: string;
  planName: string;
  startDate: string;
  renewalDate: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('payment-success', {
    ...data,
    dashboardUrl: `${baseUrl}/dashboard`,
    invoiceUrl: `${baseUrl}/account/invoices/${data.invoiceNumber}`,
  });
}

export function renderBookingConfirmationEmail(data: {
  firstName: string;
  className: string;
  classDate: string;
  classTime: string;
  duration: number;
  location: string;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  level: string;
  category: string;
  bookingId: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('booking-confirmation', {
    ...data,
    classUrl: `${baseUrl}/bookings/${data.bookingId}`,
    cancelUrl: `${baseUrl}/bookings/${data.bookingId}/cancel`,
    googleCalendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.className)}`,
    icsUrl: `${baseUrl}/api/bookings/${data.bookingId}/calendar.ics`,
  });
}

export function renderClassReminderEmail(data: {
  firstName: string;
  className: string;
  instructorName: string;
  classDate: string;
  classTime: string;
  duration: number;
  minutesRemaining: number;
  bookingId: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('class-reminder', {
    ...data,
    joinUrl: `${baseUrl}/live/${data.bookingId}`,
    cancelUrl: `${baseUrl}/bookings/${data.bookingId}/cancel`,
  });
}

export function renderSubscriptionExpiringEmail(data: {
  firstName: string;
  daysRemaining: number;
  expirationDate: string;
  originalPrice: string;
  discountedPrice: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('subscription-expiring', {
    ...data,
    renewUrl: `${baseUrl}/subscription/renew?discount=20`,
    settingsUrl: `${baseUrl}/account/subscription`,
  });
}

export function renderWeeklyDigestEmail(data: {
  firstName: string;
  weekRange: string;
  completedClasses: number;
  totalMinutes: number;
  streak: number;
  weeklyGoal: number;
  progressPercent: number;
  newAchievements?: Array<{ icon: string; title: string; description: string }>;
  recommendations: Array<{ thumbnail: string; title: string; instructor: string; duration: number; level: string }>;
  motivationQuote: string;
  quoteAuthor: string;
}): EmailTemplate {
  const baseUrl = process.env.APP_URL || 'https://app.yogaapp.com';

  return renderTemplate('weekly-digest', {
    ...data,
    dashboardUrl: `${baseUrl}/dashboard`,
    preferencesUrl: `${baseUrl}/account/preferences`,
  });
}

export type {
  TemplateVariables,
  EmailTemplate,
};
