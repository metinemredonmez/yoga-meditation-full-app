/**
 * AI Agent Seed Data
 * Default rules and templates for AI Agent system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAIAgents() {
  console.log('🤖 Seeding AI Agent data...');

  // ============================================
  // AI Agent Rules
  // ============================================
  const rules = [
    // Onboarding Rules
    {
      id: 'rule_onboarding_welcome',
      name: 'Onboarding - Hoş Geldin',
      description: 'Yeni kayıt olan kullanıcılara hoş geldin mesajı',
      agentType: 'ONBOARDING',
      triggerEvent: 'user_registered',
      triggerConditions: { daysSinceRegistration: 0 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'IN_APP', templateId: 'tpl_onboarding_welcome' },
      priority: 100,
      isActive: true,
    },
    {
      id: 'rule_onboarding_day1',
      name: 'Onboarding - Gün 1',
      description: 'İlk gün ilk meditasyonu tamamlamayanlar için hatırlatma',
      agentType: 'ONBOARDING',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceRegistration: 1, sessionsCompleted: 0 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_onboarding_day1' },
      priority: 90,
      isActive: true,
    },
    {
      id: 'rule_onboarding_day3',
      name: 'Onboarding - Gün 3',
      description: '3 gün içinde hiç pratik yapmayanlar',
      agentType: 'ONBOARDING',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceRegistration: 3, sessionsCompleted: 0 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'EMAIL', templateId: 'tpl_onboarding_day3' },
      priority: 85,
      isActive: true,
    },

    // Retention Rules
    {
      id: 'rule_retention_3day',
      name: 'Retention - 3 Gün İnaktif',
      description: '3 gün aktif olmayan kullanıcılar',
      agentType: 'RETENTION',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceActive: 3 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_retention_3day' },
      priority: 70,
      isActive: true,
    },
    {
      id: 'rule_retention_7day',
      name: 'Retention - 7 Gün İnaktif',
      description: '7 gün aktif olmayan kullanıcılar',
      agentType: 'RETENTION',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceActive: 7 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_retention_7day' },
      priority: 75,
      isActive: true,
    },
    {
      id: 'rule_retention_14day',
      name: 'Retention - 14 Gün İnaktif',
      description: '14 gün aktif olmayan kullanıcılar',
      agentType: 'RETENTION',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceActive: 14 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'EMAIL', templateId: 'tpl_retention_14day' },
      priority: 80,
      isActive: true,
    },
    {
      id: 'rule_retention_30day',
      name: 'Retention - 30 Gün İnaktif (Win-Back)',
      description: '30 gün aktif olmayan kullanıcılara özel teklif',
      agentType: 'RETENTION',
      triggerEvent: 'user_inactive',
      triggerConditions: { daysSinceActive: 30 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'EMAIL', templateId: 'tpl_retention_30day' },
      priority: 85,
      isActive: true,
    },

    // Streak Rules
    {
      id: 'rule_streak_risk',
      name: 'Streak - Risk Uyarısı',
      description: 'Streak kaybetme riski olan kullanıcılar (akşam 18:00)',
      agentType: 'STREAK_GAMIFICATION',
      triggerEvent: 'streak_at_risk',
      triggerConditions: { hoursUntilLoss: 6, minStreak: 3 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_streak_risk' },
      priority: 90,
      isActive: true,
    },
    {
      id: 'rule_streak_7day',
      name: 'Streak - 7 Gün Kutlama',
      description: '7 günlük streak tamamlayanlar',
      agentType: 'STREAK_GAMIFICATION',
      triggerEvent: 'streak_milestone',
      triggerConditions: { streakDays: 7 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'IN_APP', templateId: 'tpl_streak_7day' },
      priority: 60,
      isActive: true,
    },
    {
      id: 'rule_streak_30day',
      name: 'Streak - 30 Gün Kutlama',
      description: '30 günlük streak tamamlayanlar',
      agentType: 'STREAK_GAMIFICATION',
      triggerEvent: 'streak_milestone',
      triggerConditions: { streakDays: 30 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'IN_APP', templateId: 'tpl_streak_30day' },
      priority: 65,
      isActive: true,
    },

    // Subscription Rules
    {
      id: 'rule_sub_trial_3day',
      name: 'Subscription - Trial 3 Gün Kaldı',
      description: 'Trial bitimine 3 gün kala hatırlatma',
      agentType: 'SUBSCRIPTION',
      triggerEvent: 'trial_ending',
      triggerConditions: { daysRemaining: 3 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_sub_trial_3day' },
      priority: 80,
      isActive: true,
    },
    {
      id: 'rule_sub_trial_1day',
      name: 'Subscription - Trial Son Gün',
      description: 'Trial bitimine 1 gün kala hatırlatma',
      agentType: 'SUBSCRIPTION',
      triggerEvent: 'trial_ending',
      triggerConditions: { daysRemaining: 1 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_sub_trial_1day' },
      priority: 90,
      isActive: true,
    },
    {
      id: 'rule_sub_upgrade_prompt',
      name: 'Subscription - Premium Öneri',
      description: 'Aktif free kullanıcılara premium öneri',
      agentType: 'SUBSCRIPTION',
      triggerEvent: 'user_active',
      triggerConditions: { subscriptionTier: 'FREE', minSessions: 10 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'IN_APP', templateId: 'tpl_sub_upgrade' },
      priority: 50,
      cooldownHours: 168, // 7 gün
      isActive: true,
    },

    // Sleep Rules
    {
      id: 'rule_sleep_bedtime',
      name: 'Sleep - Uyku Zamanı Hatırlatma',
      description: 'Kullanıcının uyku saatinde hatırlatma',
      agentType: 'SLEEP',
      triggerEvent: 'bedtime_approaching',
      triggerConditions: { minutesBefore: 30 },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_sleep_bedtime' },
      priority: 70,
      isActive: true,
    },

    // Content Scheduling Rules
    {
      id: 'rule_content_morning',
      name: 'Content - Sabah Önerisi',
      description: 'Sabah saatlerinde kişiselleştirilmiş içerik önerisi',
      agentType: 'CONTENT_SCHEDULING',
      triggerEvent: 'time_of_day',
      triggerConditions: { timeRange: 'morning', hasActiveSubscription: true },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'PUSH', templateId: 'tpl_content_morning' },
      priority: 40,
      cooldownHours: 24,
      isActive: true,
    },

    // Mood Wellness Rules
    {
      id: 'rule_mood_low',
      name: 'Mood - Düşük Mood Desteği',
      description: 'Düşük mood kaydeden kullanıcılara özel içerik',
      agentType: 'MOOD_WELLNESS',
      triggerEvent: 'mood_logged',
      triggerConditions: { moodLevel: 'low' },
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { channel: 'IN_APP', templateId: 'tpl_mood_low' },
      priority: 85,
      isActive: true,
    },
  ];

  // ============================================
  // AI Agent Templates
  // ============================================
  const templates = [
    // Onboarding Templates
    {
      id: 'tpl_onboarding_welcome',
      name: 'Onboarding - Hoş Geldin',
      agentType: 'ONBOARDING',
      channel: 'IN_APP',
      titleTr: 'Hoş geldin {{user.firstName}}! 🧘',
      titleEn: 'Welcome {{user.firstName}}! 🧘',
      bodyTr: 'Yolculuğuna başlamak için ilk meditasyonunu seç. Sadece 5 dakika!',
      bodyEn: 'Choose your first meditation to start your journey. Just 5 minutes!',
      actionUrl: '/meditations/beginner',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_onboarding_day1',
      name: 'Onboarding - Gün 1',
      agentType: 'ONBOARDING',
      channel: 'PUSH',
      titleTr: 'İlk adımı atmaya hazır mısın? 🌟',
      titleEn: 'Ready to take the first step? 🌟',
      bodyTr: '{{user.firstName}}, bugün 5 dakikalık bir meditasyonla başla. Farkı hissedeceksin!',
      bodyEn: '{{user.firstName}}, start with a 5-minute meditation today. You\'ll feel the difference!',
      actionUrl: '/meditations?duration=5',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_onboarding_day3',
      name: 'Onboarding - Gün 3',
      agentType: 'ONBOARDING',
      channel: 'EMAIL',
      titleTr: 'Seni bekliyoruz 💜',
      titleEn: 'We\'re waiting for you 💜',
      bodyTr: '{{user.firstName}}, henüz ilk meditasyonunu yapmadın. Başlamak için en iyi zaman şimdi!',
      bodyEn: '{{user.firstName}}, you haven\'t done your first meditation yet. The best time to start is now!',
      actionUrl: '/meditations/quick-start',
      variables: ['user.firstName'],
      isActive: true,
    },

    // Retention Templates
    {
      id: 'tpl_retention_3day',
      name: 'Retention - 3 Gün',
      agentType: 'RETENTION',
      channel: 'PUSH',
      titleTr: 'Seni özledik! 🧘',
      titleEn: 'We miss you! 🧘',
      bodyTr: '{{user.firstName}}, son pratiğinin üzerinden 3 gün geçti. Bugün 5 dakika ayırmaya ne dersin?',
      bodyEn: '{{user.firstName}}, it\'s been 3 days since your last practice. How about 5 minutes today?',
      actionUrl: '/meditations?duration=5',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_retention_7day',
      name: 'Retention - 7 Gün',
      agentType: 'RETENTION',
      channel: 'PUSH',
      titleTr: 'Hadi yeniden başlayalım! 💪',
      titleEn: 'Let\'s start again! 💪',
      bodyTr: '{{user.firstName}}, rutinine geri dönmek için mükemmel bir gün. Seni bekleyen özel bir meditasyon var.',
      bodyEn: '{{user.firstName}}, perfect day to get back to your routine. A special meditation awaits you.',
      actionUrl: '/meditations/recommended',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_retention_14day',
      name: 'Retention - 14 Gün',
      agentType: 'RETENTION',
      channel: 'EMAIL',
      titleTr: 'Seninle yeniden buluşmak istiyoruz 💜',
      titleEn: 'We want to reconnect with you 💜',
      bodyTr: '{{user.firstName}}, 2 haftadır görüşemedik. Sana özel hazırladığımız içeriklerle geri dön!',
      bodyEn: '{{user.firstName}}, we haven\'t seen you in 2 weeks. Come back with content specially prepared for you!',
      actionUrl: '/meditations/comeback',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_retention_30day',
      name: 'Retention - 30 Gün (Win-Back)',
      agentType: 'RETENTION',
      channel: 'EMAIL',
      titleTr: 'Seni çok özledik! Özel bir teklifimiz var 🎁',
      titleEn: 'We really miss you! We have a special offer 🎁',
      bodyTr: '{{user.firstName}}, geri dönmen için sana özel %50 indirim hazırladık. 7 gün geçerli!',
      bodyEn: '{{user.firstName}}, we\'ve prepared a special 50% discount for you to come back. Valid for 7 days!',
      actionUrl: '/subscription/winback-offer',
      variables: ['user.firstName'],
      isActive: true,
    },

    // Streak Templates
    {
      id: 'tpl_streak_risk',
      name: 'Streak - Risk Uyarısı',
      agentType: 'STREAK_GAMIFICATION',
      channel: 'PUSH',
      titleTr: 'Streak\'in tehlikede! 🔥',
      titleEn: 'Your streak is at risk! 🔥',
      bodyTr: '{{streak.count}} günlük streak\'ini kaybetmemek için bugün pratik yapmayı unutma!',
      bodyEn: 'Don\'t forget to practice today to keep your {{streak.count}} day streak!',
      actionUrl: '/meditations/quick',
      variables: ['streak.count'],
      isActive: true,
    },
    {
      id: 'tpl_streak_7day',
      name: 'Streak - 7 Gün',
      agentType: 'STREAK_GAMIFICATION',
      channel: 'IN_APP',
      titleTr: 'Harika! 7 gün tamamlandı! 🎉',
      titleEn: 'Amazing! 7 days completed! 🎉',
      bodyTr: 'Tebrikler {{user.firstName}}! Bir haftadır hiç aksatmadın. Bu harika bir başarı!',
      bodyEn: 'Congratulations {{user.firstName}}! You haven\'t missed a day for a week. This is a great achievement!',
      actionUrl: '/profile/achievements',
      variables: ['user.firstName'],
      isActive: true,
    },
    {
      id: 'tpl_streak_30day',
      name: 'Streak - 30 Gün',
      agentType: 'STREAK_GAMIFICATION',
      channel: 'IN_APP',
      titleTr: 'İnanılmaz! 30 gün! 🏆',
      titleEn: 'Incredible! 30 days! 🏆',
      bodyTr: '{{user.firstName}}, 30 günlük streak! Sen gerçek bir meditasyon ustasısın!',
      bodyEn: '{{user.firstName}}, 30 day streak! You\'re a true meditation master!',
      actionUrl: '/profile/achievements',
      variables: ['user.firstName'],
      isActive: true,
    },

    // Subscription Templates
    {
      id: 'tpl_sub_trial_3day',
      name: 'Subscription - Trial 3 Gün',
      agentType: 'SUBSCRIPTION',
      channel: 'PUSH',
      titleTr: 'Premium denemen bitiyor ⏰',
      titleEn: 'Your trial is ending ⏰',
      bodyTr: 'Premium deneme süren 3 gün sonra bitiyor. Tüm içeriklere erişmeye devam etmek için şimdi abone ol!',
      bodyEn: 'Your premium trial ends in 3 days. Subscribe now to keep accessing all content!',
      actionUrl: '/subscription/plans',
      variables: [],
      isActive: true,
    },
    {
      id: 'tpl_sub_trial_1day',
      name: 'Subscription - Trial Son Gün',
      agentType: 'SUBSCRIPTION',
      channel: 'PUSH',
      titleTr: 'Son gün! Premium\'u kaçırma 🌟',
      titleEn: 'Last day! Don\'t miss Premium 🌟',
      bodyTr: 'Premium denemen bugün bitiyor. Şimdi abone ol ve kesintisiz devam et!',
      bodyEn: 'Your premium trial ends today. Subscribe now and continue without interruption!',
      actionUrl: '/subscription/plans',
      variables: [],
      isActive: true,
    },
    {
      id: 'tpl_sub_upgrade',
      name: 'Subscription - Upgrade Öneri',
      agentType: 'SUBSCRIPTION',
      channel: 'IN_APP',
      titleTr: 'Premium\'a yükselt, sınırsız keşfet! ✨',
      titleEn: 'Upgrade to Premium, explore unlimited! ✨',
      bodyTr: '{{user.firstName}}, {{sessions}} meditasyon tamamladın! Premium ile tüm içeriklere eriş.',
      bodyEn: '{{user.firstName}}, you\'ve completed {{sessions}} meditations! Access all content with Premium.',
      actionUrl: '/subscription/plans',
      variables: ['user.firstName', 'sessions'],
      isActive: true,
    },

    // Sleep Templates
    {
      id: 'tpl_sleep_bedtime',
      name: 'Sleep - Uyku Hatırlatma',
      agentType: 'SLEEP',
      channel: 'PUSH',
      titleTr: 'Uyku zamanı yaklaşıyor 😴',
      titleEn: 'Bedtime is approaching 😴',
      bodyTr: '{{user.firstName}}, rahatlatıcı bir uyku hikayesiyle güne veda et.',
      bodyEn: '{{user.firstName}}, say goodbye to the day with a relaxing sleep story.',
      actionUrl: '/sleep/stories',
      variables: ['user.firstName'],
      isActive: true,
    },

    // Content Templates
    {
      id: 'tpl_content_morning',
      name: 'Content - Sabah Önerisi',
      agentType: 'CONTENT_SCHEDULING',
      channel: 'PUSH',
      titleTr: 'Günaydın! ☀️',
      titleEn: 'Good morning! ☀️',
      bodyTr: '{{user.firstName}}, güne enerjik başla! Sana özel {{recommendation}} hazırladık.',
      bodyEn: '{{user.firstName}}, start the day energized! We\'ve prepared {{recommendation}} just for you.',
      actionUrl: '/meditations/morning',
      variables: ['user.firstName', 'recommendation'],
      isActive: true,
    },

    // Mood Templates
    {
      id: 'tpl_mood_low',
      name: 'Mood - Düşük Mood',
      agentType: 'MOOD_WELLNESS',
      channel: 'IN_APP',
      titleTr: 'Buradayız 💜',
      titleEn: 'We\'re here 💜',
      bodyTr: '{{user.firstName}}, kendini daha iyi hissetmeni sağlayacak içerikler hazırladık.',
      bodyEn: '{{user.firstName}}, we\'ve prepared content to help you feel better.',
      actionUrl: '/meditations/stress-relief',
      variables: ['user.firstName'],
      isActive: true,
    },
  ];

  // Insert rules
  for (const rule of rules) {
    await prisma.ai_agent_rules.upsert({
      where: { id: rule.id },
      update: {
        name: rule.name,
        description: rule.description,
        agentType: rule.agentType as any,
        triggerEvent: rule.triggerEvent,
        triggerConditions: rule.triggerConditions,
        actionType: rule.actionType,
        actionConfig: rule.actionConfig,
        priority: rule.priority,
        cooldownHours: (rule as any).cooldownHours,
        isActive: rule.isActive,
      },
      create: rule as any,
    });
  }

  console.log(`✅ Created ${rules.length} AI Agent rules`);

  // Insert templates
  for (const template of templates) {
    await prisma.ai_agent_templates.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        agentType: template.agentType as any,
        channel: template.channel as any,
        titleTr: template.titleTr,
        titleEn: template.titleEn,
        bodyTr: template.bodyTr,
        bodyEn: template.bodyEn,
        actionUrl: template.actionUrl,
        variables: template.variables,
        isActive: template.isActive,
      },
      create: template as any,
    });
  }

  console.log(`✅ Created ${templates.length} AI Agent templates`);

  console.log('🎉 AI Agent seed completed!');
}

// Export for use in main seed file
export default seedAIAgents;
