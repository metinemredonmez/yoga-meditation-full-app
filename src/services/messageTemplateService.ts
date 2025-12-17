import Handlebars from 'handlebars';
import { prisma } from '../utils/database';
import { MessageChannel, MessageCategory, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date: Date) => {
  return date ? new Date(date).toLocaleDateString('tr-TR') : '';
});

Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
});

Handlebars.registerHelper('capitalize', (str: string) => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
});

export interface CreateTemplateInput {
  name: string;
  slug: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  bodyPush?: string;
  bodySms?: string;
  channel: MessageChannel;
  category: MessageCategory;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  bodyPush?: string;
  bodySms?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface RenderedMessage {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  bodyPush?: string;
  bodySms?: string;
}

/**
 * Create a new message template
 */
export async function createTemplate(input: CreateTemplateInput) {
  return prisma.messageTemplate.create({
    data: {
      name: input.name,
      slug: input.slug,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      bodyPush: input.bodyPush,
      bodySms: input.bodySms,
      channel: input.channel,
      category: input.category,
      variables: input.variables || [],
      isActive: input.isActive ?? true,
    },
  });
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, input: UpdateTemplateInput) {
  return prisma.messageTemplate.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
  return prisma.messageTemplate.delete({
    where: { id },
  });
}

/**
 * Get template by slug
 */
export async function getTemplateBySlug(slug: string) {
  return prisma.messageTemplate.findUnique({
    where: { slug },
  });
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string) {
  return prisma.messageTemplate.findUnique({
    where: { id },
  });
}

/**
 * Get all templates with filters
 */
export async function getAllTemplates(filters?: {
  channel?: MessageChannel;
  category?: MessageCategory;
  isActive?: boolean;
}) {
  const where: Prisma.MessageTemplateWhereInput = {};

  if (filters?.channel) where.channel = filters.channel;
  if (filters?.category) where.category = filters.category;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.messageTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Render a template with variables
 */
export async function renderTemplate(
  templateIdOrSlug: string,
  variables: Record<string, unknown>
): Promise<RenderedMessage> {
  // Try to find by ID first, then by slug
  let template = await prisma.messageTemplate.findUnique({
    where: { id: templateIdOrSlug },
  });

  if (!template) {
    template = await prisma.messageTemplate.findUnique({
      where: { slug: templateIdOrSlug },
    });
  }

  if (!template) {
    throw new Error(`Template not found: ${templateIdOrSlug}`);
  }

  if (!template.isActive) {
    throw new Error(`Template is inactive: ${templateIdOrSlug}`);
  }

  const result: RenderedMessage = {};

  try {
    if (template.subject) {
      const subjectTemplate = Handlebars.compile(template.subject);
      result.subject = subjectTemplate(variables);
    }

    if (template.bodyHtml) {
      const htmlTemplate = Handlebars.compile(template.bodyHtml);
      result.bodyHtml = htmlTemplate(variables);
    }

    if (template.bodyText) {
      const textTemplate = Handlebars.compile(template.bodyText);
      result.bodyText = textTemplate(variables);
    }

    if (template.bodyPush) {
      const pushTemplate = Handlebars.compile(template.bodyPush);
      result.bodyPush = pushTemplate(variables);
    }

    if (template.bodySms) {
      const smsTemplate = Handlebars.compile(template.bodySms);
      result.bodySms = smsTemplate(variables);
    }
  } catch (error) {
    logger.error({ error, templateId: templateIdOrSlug }, 'Error rendering template');
    throw new Error(`Error rendering template: ${templateIdOrSlug}`);
  }

  return result;
}

/**
 * Validate template variables
 */
export async function validateTemplateVariables(
  templateIdOrSlug: string,
  variables: Record<string, unknown>
): Promise<{ valid: boolean; missingVariables: string[] }> {
  let template = await prisma.messageTemplate.findUnique({
    where: { id: templateIdOrSlug },
  });

  if (!template) {
    template = await prisma.messageTemplate.findUnique({
      where: { slug: templateIdOrSlug },
    });
  }

  if (!template) {
    throw new Error(`Template not found: ${templateIdOrSlug}`);
  }

  const requiredVariables = (template.variables as string[]) || [];
  const providedVariables = Object.keys(variables);
  const missingVariables = requiredVariables.filter(v => !providedVariables.includes(v));

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Initialize default templates
 */
export async function initializeDefaultTemplates() {
  const defaultTemplates: CreateTemplateInput[] = [
    // Welcome Messages
    {
      name: 'Welcome Email',
      slug: 'welcome_email',
      subject: 'Yoga App\'e Hoş Geldiniz, {{firstName}}!',
      bodyHtml: `
        <h1>Hoş Geldiniz, {{firstName}}!</h1>
        <p>Yoga App ailesine katıldığınız için çok mutluyuz.</p>
        <p>Hemen başlamak için:</p>
        <ul>
          <li>Profilinizi tamamlayın</li>
          <li>İlk programınızı seçin</li>
          <li>Günlük hatırlatıcı ayarlayın</li>
        </ul>
        <a href="{{appUrl}}/programs">Programları Keşfet</a>
      `,
      bodyText: 'Hoş Geldiniz, {{firstName}}! Yoga App ailesine katıldığınız için çok mutluyuz.',
      bodyPush: '{{firstName}}, yoga yolculuğunuza başlamaya hazır mısınız?',
      channel: 'EMAIL',
      category: 'WELCOME',
      variables: ['firstName', 'appUrl'],
    },
    {
      name: 'Welcome Push',
      slug: 'welcome_push',
      bodyPush: 'Hoş geldin {{firstName}}! İlk seansın seni bekliyor.',
      channel: 'PUSH',
      category: 'WELCOME',
      variables: ['firstName'],
    },

    // Trial Messages
    {
      name: 'Trial Started',
      slug: 'trial_started',
      subject: '{{trialDays}} Günlük Ücretsiz Denemeniz Başladı!',
      bodyHtml: `
        <h1>Deneme Süreniz Başladı!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>{{trialDays}} günlük ücretsiz deneme süreniz başladı. Bu sürede tüm premium özelliklere erişebilirsiniz.</p>
        <p>Deneme süreniz {{trialEndDate}} tarihinde sona erecek.</p>
        <a href="{{appUrl}}/programs">Premium İçerikleri Keşfet</a>
      `,
      bodyText: '{{trialDays}} günlük ücretsiz denemeniz başladı! {{trialEndDate}} tarihine kadar tüm premium özelliklere erişebilirsiniz.',
      bodyPush: '{{trialDays}} gün ücretsiz! Premium özellikleri keşfet.',
      channel: 'EMAIL',
      category: 'TRIAL',
      variables: ['firstName', 'trialDays', 'trialEndDate', 'appUrl'],
    },
    {
      name: 'Trial Ending 3 Days',
      slug: 'trial_ending_3days',
      subject: 'Deneme Süreniz 3 Gün İçinde Sona Eriyor',
      bodyHtml: `
        <h1>Deneme Süreniz Bitiyor</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Ücretsiz deneme süreniz 3 gün içinde sona eriyor.</p>
        <p>Premium üyeliğe geçerek yoga yolculuğunuza devam edin.</p>
        <a href="{{appUrl}}/subscription">Premium'a Geç</a>
      `,
      bodyText: 'Deneme süreniz 3 gün içinde sona eriyor. Premium üyeliğe geçmeyi unutmayın!',
      bodyPush: '3 gün kaldı! Premium üyeliğe geçmeyi düşündünüz mü?',
      channel: 'EMAIL',
      category: 'TRIAL',
      variables: ['firstName', 'appUrl'],
    },
    {
      name: 'Trial Ending 1 Day',
      slug: 'trial_ending_1day',
      subject: 'Son Gün! Deneme Süreniz Yarın Bitiyor',
      bodyHtml: `
        <h1>Son Gün!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Ücretsiz deneme süreniz yarın sona eriyor.</p>
        <p>Bugün premium üyeliğe geçin ve erişiminizi kaybetmeyin.</p>
        <a href="{{appUrl}}/subscription">Hemen Premium'a Geç</a>
      `,
      bodyText: 'Deneme süreniz yarın sona eriyor! Bugün premium üyeliğe geçin.',
      bodyPush: 'Son gün! Premium üyeliğe geçmek için bugün son şans.',
      channel: 'EMAIL',
      category: 'TRIAL',
      variables: ['firstName', 'appUrl'],
    },
    {
      name: 'Trial Expired',
      slug: 'trial_expired',
      subject: 'Deneme Süreniz Sona Erdi',
      bodyHtml: `
        <h1>Deneme Süreniz Sona Erdi</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Ücretsiz deneme süreniz sona erdi. Premium özelliklere erişiminiz kısıtlandı.</p>
        <p>Yoga yolculuğunuza devam etmek için premium üyeliğe geçin.</p>
        <a href="{{appUrl}}/subscription">Premium'a Geç</a>
      `,
      bodyText: 'Deneme süreniz sona erdi. Premium üyeliğe geçerek devam edin.',
      bodyPush: 'Denemen sona erdi. Yolculuğuna devam etmek ister misin?',
      channel: 'EMAIL',
      category: 'TRIAL',
      variables: ['firstName', 'appUrl'],
    },

    // Subscription Messages
    {
      name: 'Subscription Started',
      slug: 'subscription_started',
      subject: 'Premium Üyeliğiniz Aktif - Hoş Geldiniz!',
      bodyHtml: `
        <h1>Premium Üyeliğiniz Aktif!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>{{planName}} planına hoş geldiniz! Artık tüm premium özelliklere erişebilirsiniz.</p>
        <p>Premium avantajlarınız:</p>
        <ul>
          <li>Sınırsız program erişimi</li>
          <li>Çevrimdışı indirme</li>
          <li>Özel içerikler</li>
        </ul>
        <a href="{{appUrl}}/programs">Hemen Başla</a>
      `,
      bodyText: 'Premium üyeliğiniz aktif! {{planName}} planına hoş geldiniz.',
      bodyPush: 'Premium üyeliğin aktif! Tüm içerikleri keşfet.',
      channel: 'EMAIL',
      category: 'SUBSCRIPTION',
      variables: ['firstName', 'planName', 'appUrl'],
    },
    {
      name: 'Subscription Renewing',
      slug: 'subscription_renewing',
      subject: 'Üyeliğiniz {{renewalDate}} Tarihinde Yenileniyor',
      bodyHtml: `
        <h1>Üyeliğiniz Yakında Yenileniyor</h1>
        <p>Merhaba {{firstName}},</p>
        <p>{{planName}} üyeliğiniz {{renewalDate}} tarihinde otomatik olarak yenilenecek.</p>
        <p>Yenileme tutarı: {{amount}}</p>
        <p>İptal etmek isterseniz yenileme tarihinden önce hesap ayarlarınızdan yapabilirsiniz.</p>
      `,
      bodyText: 'Üyeliğiniz {{renewalDate}} tarihinde {{amount}} tutarında yenilenecek.',
      channel: 'EMAIL',
      category: 'SUBSCRIPTION',
      variables: ['firstName', 'planName', 'renewalDate', 'amount', 'appUrl'],
    },
    {
      name: 'Subscription Cancelled',
      slug: 'subscription_cancelled',
      subject: 'Üyeliğiniz İptal Edildi',
      bodyHtml: `
        <h1>Üyeliğiniz İptal Edildi</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Üyeliğinizi iptal ettiğinizi gördük. Premium erişiminiz {{endDate}} tarihine kadar devam edecek.</p>
        <p>Fikrinizi değiştirirseniz her zaman geri dönebilirsiniz.</p>
        <a href="{{appUrl}}/subscription">Üyeliği Yeniden Başlat</a>
      `,
      bodyText: 'Üyeliğiniz iptal edildi. Premium erişiminiz {{endDate}} tarihine kadar devam edecek.',
      channel: 'EMAIL',
      category: 'SUBSCRIPTION',
      variables: ['firstName', 'endDate', 'appUrl'],
    },
    {
      name: 'Subscription Expired',
      slug: 'subscription_expired',
      subject: 'Premium Üyeliğiniz Sona Erdi',
      bodyHtml: `
        <h1>Premium Üyeliğiniz Sona Erdi</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Premium üyeliğiniz sona erdi. Artık ücretsiz plana geçtiniz.</p>
        <p>Premium avantajlarını tekrar kazanmak için üyeliğinizi yenileyin.</p>
        <a href="{{appUrl}}/subscription">Üyeliği Yenile</a>
      `,
      bodyText: 'Premium üyeliğiniz sona erdi. Yeniden abone olmak için tıklayın.',
      bodyPush: 'Premium üyeliğin sona erdi. Tekrar katıl!',
      channel: 'EMAIL',
      category: 'SUBSCRIPTION',
      variables: ['firstName', 'appUrl'],
    },

    // Payment Messages
    {
      name: 'Payment Failed',
      slug: 'payment_failed',
      subject: 'Ödeme Başarısız - Güncelleme Gerekli',
      bodyHtml: `
        <h1>Ödeme Başarısız</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Üyelik ödemeniz başarısız oldu. Bu {{attemptNumber}}. denememiz.</p>
        <p>Lütfen ödeme bilgilerinizi güncelleyin.</p>
        <a href="{{appUrl}}/settings/payment">Ödeme Bilgilerini Güncelle</a>
      `,
      bodyText: 'Ödemeniz başarısız oldu. Lütfen ödeme bilgilerinizi güncelleyin.',
      bodyPush: 'Ödemen başarısız oldu. Ödeme bilgilerini güncelle.',
      channel: 'EMAIL',
      category: 'PAYMENT',
      variables: ['firstName', 'attemptNumber', 'appUrl'],
    },
    {
      name: 'Payment Retry Scheduled',
      slug: 'payment_retry',
      subject: 'Ödeme Tekrar Denenecek',
      bodyHtml: `
        <h1>Ödeme Tekrar Denenecek</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Ödemenizi {{retryDate}} tarihinde tekrar deneyeceğiz.</p>
        <p>Sorun yaşamamak için ödeme bilgilerinizi kontrol edin.</p>
        <a href="{{appUrl}}/settings/payment">Ödeme Bilgilerini Kontrol Et</a>
      `,
      bodyText: 'Ödemeniz {{retryDate}} tarihinde tekrar denenecek.',
      channel: 'EMAIL',
      category: 'PAYMENT',
      variables: ['firstName', 'retryDate', 'appUrl'],
    },
    {
      name: 'Payment Success',
      slug: 'payment_success',
      subject: 'Ödemeniz Alındı - Teşekkürler!',
      bodyHtml: `
        <h1>Ödemeniz Alındı</h1>
        <p>Merhaba {{firstName}},</p>
        <p>{{amount}} tutarındaki ödemeniz başarıyla alındı.</p>
        <p>Faturanızı aşağıdaki linkten görüntüleyebilirsiniz:</p>
        <a href="{{invoiceUrl}}">Faturayı Görüntüle</a>
      `,
      bodyText: '{{amount}} tutarındaki ödemeniz alındı. Teşekkürler!',
      channel: 'EMAIL',
      category: 'PAYMENT',
      variables: ['firstName', 'amount', 'invoiceUrl'],
    },

    // Digest Messages
    {
      name: 'Weekly Digest',
      slug: 'weekly_digest',
      subject: 'Bu Haftaki Yoga Özetin - {{weekRange}}',
      bodyHtml: `
        <h1>Haftalık Özet</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Bu hafta harika iş çıkardın!</p>
        <div>
          <h3>Bu Hafta</h3>
          <ul>
            <li>Tamamlanan Seanslar: {{completedSessions}}</li>
            <li>Toplam Pratik Süresi: {{totalMinutes}} dakika</li>
            <li>Güncel Seri: {{currentStreak}} gün</li>
          </ul>
        </div>
        {{#if newContent}}
        <div>
          <h3>Bu Hafta Denediğin Yeni İçerikler</h3>
          <p>{{newContent}}</p>
        </div>
        {{/if}}
        {{#if recommendations}}
        <div>
          <h3>Senin İçin Öneriler</h3>
          <p>{{recommendations}}</p>
        </div>
        {{/if}}
        <a href="{{appUrl}}/progress">Detaylı İlerleme</a>
      `,
      bodyText: 'Bu hafta {{completedSessions}} seans tamamladın, {{totalMinutes}} dakika pratik yaptın. Serin: {{currentStreak}} gün!',
      channel: 'EMAIL',
      category: 'DIGEST',
      variables: ['firstName', 'weekRange', 'completedSessions', 'totalMinutes', 'currentStreak', 'newContent', 'recommendations', 'appUrl'],
    },
    {
      name: 'Monthly Digest',
      slug: 'monthly_digest',
      subject: '{{monthName}} Ayı Yoga Özetin',
      bodyHtml: `
        <h1>Aylık Özet - {{monthName}}</h1>
        <p>Merhaba {{firstName}},</p>
        <p>{{monthName}} ayında harika bir performans gösterdin!</p>
        <div>
          <h3>Bu Ay</h3>
          <ul>
            <li>Tamamlanan Seanslar: {{completedSessions}}</li>
            <li>Toplam Pratik Süresi: {{totalMinutes}} dakika</li>
            <li>En Uzun Seri: {{longestStreak}} gün</li>
            <li>Denenen Program Sayısı: {{programsStarted}}</li>
          </ul>
        </div>
        {{#if achievements}}
        <div>
          <h3>Kazanılan Rozetler</h3>
          <p>{{achievements}}</p>
        </div>
        {{/if}}
        <div>
          <h3>Yılbaşından Beri</h3>
          <p>Toplam: {{yearlyMinutes}} dakika pratik</p>
        </div>
        <a href="{{appUrl}}/progress">Detaylı İstatistikler</a>
      `,
      bodyText: '{{monthName}} ayında {{completedSessions}} seans, {{totalMinutes}} dakika pratik. En uzun seri: {{longestStreak}} gün!',
      channel: 'EMAIL',
      category: 'DIGEST',
      variables: ['firstName', 'monthName', 'completedSessions', 'totalMinutes', 'longestStreak', 'programsStarted', 'achievements', 'yearlyMinutes', 'appUrl'],
    },

    // Inactivity Messages
    {
      name: 'Inactivity 7 Days',
      slug: 'inactivity_7days',
      subject: 'Seni Özledik! Hadi Yoga Yapalım',
      bodyHtml: `
        <h1>Seni Özledik!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>7 gündür seni göremedik. Yoga matın seni bekliyor!</p>
        <p>5 dakikalık kısa bir seansla başlamaya ne dersin?</p>
        <a href="{{appUrl}}/programs/quick">5 Dakikalık Seans</a>
      `,
      bodyText: '7 gündür seni göremedik. Yoga matın seni bekliyor!',
      bodyPush: '7 gündür görüşemedik. Bugün 5 dakikalık bir seans?',
      channel: 'EMAIL',
      category: 'INACTIVITY',
      variables: ['firstName', 'appUrl'],
    },
    {
      name: 'Inactivity 14 Days',
      slug: 'inactivity_14days',
      subject: 'Özel Teklif: Yoga Yolculuğuna Geri Dön',
      bodyHtml: `
        <h1>Geri Dön!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>14 gündür seninle pratik yapamadık. Seni geri kazanmak istiyoruz!</p>
        <p>Senin için özel bir teklif hazırladık.</p>
        <a href="{{appUrl}}/offer/comeback">Teklifi Gör</a>
      `,
      bodyText: '14 gündür görüşemedik. Senin için özel bir teklif var!',
      bodyPush: 'Sana özel bir teklifimiz var. Yoga yolculuğuna geri dön!',
      channel: 'EMAIL',
      category: 'INACTIVITY',
      variables: ['firstName', 'appUrl'],
    },
    {
      name: 'Inactivity 30 Days',
      slug: 'inactivity_30days',
      subject: 'Bir Ay Oldu - Neler Kaçırdın?',
      bodyHtml: `
        <h1>Bir Ay Oldu!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Son ziyaretinden bu yana 30 gün geçti. Bu sürede çok şey değişti!</p>
        <p>Yeni eklenen içerikler:</p>
        <ul>
          <li>Yeni programlar</li>
          <li>Yeni pozlar</li>
          <li>Topluluk etkinlikleri</li>
        </ul>
        <a href="{{appUrl}}/whats-new">Yenilikleri Keşfet</a>
      `,
      bodyText: '30 gündür görüşemedik. Yeni içeriklerimizi keşfet!',
      bodyPush: 'Bir aydır buradasın. Yeni içeriklerimizi görmelisin!',
      channel: 'EMAIL',
      category: 'INACTIVITY',
      variables: ['firstName', 'appUrl'],
    },

    // Challenge Messages
    {
      name: 'Challenge Reminder',
      slug: 'challenge_reminder',
      subject: 'Challenge Hatırlatması: {{challengeName}}',
      bodyHtml: `
        <h1>Challenge Hatırlatması</h1>
        <p>Merhaba {{firstName}},</p>
        <p><strong>{{challengeName}}</strong> challenge'ında {{progress}}/{{targetDays}} gün tamamladın!</p>
        <p>Bugünkü seansını yapmayı unutma!</p>
        <a href="{{appUrl}}/challenges/{{challengeId}}">Challenge'a Git</a>
      `,
      bodyText: '{{challengeName}} challenge\'ında {{progress}}/{{targetDays}} gün. Bugünkü seansını unutma!',
      bodyPush: '{{challengeName}}: {{progress}}/{{targetDays}} gün. Bugün de yapabilirsin!',
      channel: 'EMAIL',
      category: 'CHALLENGE',
      variables: ['firstName', 'challengeName', 'challengeId', 'progress', 'targetDays', 'appUrl'],
    },
    {
      name: 'Challenge Completed',
      slug: 'challenge_completed',
      subject: 'Tebrikler! {{challengeName}} Challenge\'ını Tamamladın!',
      bodyHtml: `
        <h1>Challenge Tamamlandı!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Harika iş çıkardın! <strong>{{challengeName}}</strong> challenge'ını başarıyla tamamladın!</p>
        <p>Bu başarı için sana özel bir rozet kazandın.</p>
        <p>Yeni bir challenge'a başlamaya ne dersin?</p>
        <a href="{{appUrl}}/challenges">Yeni Challenge Bul</a>
      `,
      bodyText: 'Tebrikler! {{challengeName}} challenge\'ını tamamladın! Yeni bir challenge\'a başla.',
      bodyPush: 'Tebrikler! {{challengeName}} tamamlandı! Yeni rozet kazandın.',
      channel: 'EMAIL',
      category: 'CHALLENGE',
      variables: ['firstName', 'challengeName', 'appUrl'],
    },

    // Content Messages
    {
      name: 'New Content Available',
      slug: 'new_content_available',
      subject: 'Yeni İçerik: {{contentTitle}}',
      bodyHtml: `
        <h1>Yeni İçerik Eklendi!</h1>
        <p>Merhaba {{firstName}},</p>
        <p>Beğeneceğini düşündüğümüz yeni bir {{contentType}} eklendi:</p>
        <h2>{{contentTitle}}</h2>
        <p>{{contentDescription}}</p>
        <a href="{{appUrl}}/{{contentType}}/{{contentId}}">Hemen Keşfet</a>
      `,
      bodyText: 'Yeni {{contentType}}: {{contentTitle}}. Hemen keşfet!',
      bodyPush: 'Yeni içerik: {{contentTitle}}',
      channel: 'EMAIL',
      category: 'CONTENT',
      variables: ['firstName', 'contentType', 'contentId', 'contentTitle', 'contentDescription', 'appUrl'],
    },

    // Campaign Messages
    {
      name: 'Promotional Campaign',
      slug: 'promotional_campaign',
      subject: '{{campaignTitle}}',
      bodyHtml: `
        <h1>{{campaignTitle}}</h1>
        <p>Merhaba {{firstName}},</p>
        {{{campaignContent}}}
        <a href="{{ctaUrl}}">{{ctaText}}</a>
      `,
      bodyText: '{{campaignTitle}}: {{campaignSummary}}',
      bodyPush: '{{campaignPushText}}',
      channel: 'EMAIL',
      category: 'CAMPAIGN',
      variables: ['firstName', 'campaignTitle', 'campaignContent', 'campaignSummary', 'campaignPushText', 'ctaUrl', 'ctaText'],
    },
  ];

  for (const template of defaultTemplates) {
    const existing = await prisma.messageTemplate.findUnique({
      where: { slug: template.slug },
    });

    if (!existing) {
      await createTemplate(template);
      logger.info({ slug: template.slug }, 'Created default message template');
    }
  }

  logger.info('Default message templates initialized');
}
