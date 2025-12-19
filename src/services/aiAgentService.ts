/**
 * AI Agent Service
 * Comprehensive intelligent agent system for user engagement
 * Similar to Calm/Headspace/Meditopia engagement systems
 *
 * 10 Agent Types:
 * 1. ONBOARDING - New user guidance
 * 2. PERSONALIZATION - Personalized content recommendations
 * 3. RETENTION - Churn prevention, re-engagement
 * 4. MOOD_WELLNESS - Mental health tracking and support
 * 5. STREAK_GAMIFICATION - Motivation and gamification
 * 6. SUBSCRIPTION - Conversion and monetization
 * 7. CONTENT_SCHEDULING - Optimal content timing
 * 8. SLEEP - Sleep assistant
 * 9. INSTRUCTOR - Instructor insights
 * 10. SUPPORT - Support chatbot
 */

import { prisma } from '../utils/database';
import { aiService } from './aiService';
import { subscriptionRecommendationService } from './subscriptionRecommendationService';
import { logger } from '../utils/logger';
import {
  AgentType,
  AgentChannel,
  AgentEventStatus,
} from '@prisma/client';

// ============================================
// Types
// ============================================

export interface AgentMessage {
  type: AgentChannel;
  title: string;
  body: string;
  action?: {
    type: 'open_content' | 'open_plan' | 'open_feature' | 'open_goal' | 'open_meditation' | 'open_sleep' | 'open_journal';
    targetId?: string;
    deepLink?: string;
  };
  metadata?: Record<string, any>;
  priority?: number;
  scheduledAt?: Date;
}

export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: string;
  lastActiveAt: Date | null;
  streakDays: number;
  longestStreak: number;
  totalMinutes: number;
  favoriteCategory: string | null;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  onboardingCompleted: boolean;
  goals: string[];
  preferredTime: string | null;
  timezone: string;
  createdAt: Date;
  daysSinceCreation: number;
  daysSinceActive: number;
  todaysMood: number | null;
  weeklyMoodAverage: number | null;
  lastMoodTrend: 'improving' | 'declining' | 'stable' | null;
}

export interface AgentPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  maxDailyPush: number;
  maxDailyEmail: number;
  preferredTime: string | null;
  timezone: string;
  disabledAgents: AgentType[];
}

// ============================================
// AI Agent Service
// ============================================

export const aiAgentService = {
  // ============================================
  // Context & Preferences
  // ============================================

  /**
   * Get comprehensive user context for agents
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
        user_onboarding: true,
        user_engagement_stats: true,
        user_goals: {
          where: { isActive: true },
          select: { type: true },
        },
        mood_entries: {
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { createdAt: 'desc' },
          take: 7,
        },
      },
    });

    if (!user) return null;

    // Get usage stats
    const categories = await subscriptionRecommendationService.getCategoryBreakdown(userId, 30);
    const totalMinutes = categories.reduce((sum, c) => sum + c.usageMinutes, 0);
    const favoriteCategory = categories[0]?.category || null;

    // Get last activity
    const lastActivity = await prisma.video_progress.findFirst({
      where: { userId },
      orderBy: { lastWatchedAt: 'desc' },
    });

    const now = new Date();
    const lastActiveAt = lastActivity?.lastWatchedAt || null;
    const daysSinceActive = lastActiveAt
      ? Math.floor((now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const daysSinceCreation = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate mood metrics
    const moodEntries = user.mood_entries;
    const todaysMood = moodEntries.find(
      (m) => m.createdAt.toDateString() === now.toDateString()
    )?.moodScore || null;

    const weeklyMoodAverage = moodEntries.length > 0
      ? moodEntries.reduce((sum, m) => sum + (m.moodScore || 0), 0) / moodEntries.length
      : null;

    // Calculate mood trend
    let lastMoodTrend: 'improving' | 'declining' | 'stable' | null = null;
    if (moodEntries.length >= 3) {
      const recentAvg = moodEntries.slice(0, 3).reduce((s, m) => s + (m.moodScore || 0), 0) / 3;
      const olderAvg = moodEntries.slice(-3).reduce((s, m) => s + (m.moodScore || 0), 0) / 3;
      if (recentAvg > olderAvg + 0.5) lastMoodTrend = 'improving';
      else if (recentAvg < olderAvg - 0.5) lastMoodTrend = 'declining';
      else lastMoodTrend = 'stable';
    }

    return {
      userId,
      name: user.firstName || 'Kullanıcı',
      email: user.email,
      role: user.role,
      lastActiveAt,
      streakDays: user.user_engagement_stats?.currentStreak || 0,
      longestStreak: user.user_engagement_stats?.longestStreak || 0,
      totalMinutes,
      favoriteCategory,
      subscriptionTier: user.subscriptions[0]?.plan?.tier || 'FREE',
      subscriptionExpiresAt: user.subscriptions[0]?.currentPeriodEnd || null,
      onboardingCompleted: user.user_onboarding?.isCompleted || false,
      goals: user.user_goals.map((g) => g.type),
      preferredTime: user.user_onboarding?.preferredTime || null,
      timezone: user.timezone || 'Europe/Istanbul',
      createdAt: user.createdAt,
      daysSinceCreation,
      daysSinceActive,
      todaysMood,
      weeklyMoodAverage,
      lastMoodTrend,
    };
  },

  /**
   * Get user agent preferences
   */
  async getUserPreferences(userId: string): Promise<AgentPreferences> {
    const prefs = await prisma.user_agent_preferences.findUnique({
      where: { userId },
    });

    return {
      pushEnabled: prefs?.pushEnabled ?? true,
      emailEnabled: prefs?.emailEnabled ?? true,
      inAppEnabled: prefs?.inAppEnabled ?? true,
      smsEnabled: prefs?.smsEnabled ?? false,
      quietHoursStart: prefs?.quietHoursStart || '22:00',
      quietHoursEnd: prefs?.quietHoursEnd || '08:00',
      maxDailyPush: prefs?.maxDailyPush || 5,
      maxDailyEmail: prefs?.maxDailyEmail || 2,
      preferredTime: prefs?.preferredTime || null,
      timezone: prefs?.timezone || 'Europe/Istanbul',
      disabledAgents: [],
    };
  },

  /**
   * Check if currently in quiet hours
   */
  isQuietHours(prefs: AgentPreferences): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    const startParts = prefs.quietHoursStart.split(':').map(Number);
    const endParts = prefs.quietHoursEnd.split(':').map(Number);
    const startH = startParts[0] ?? 0;
    const startM = startParts[1] ?? 0;
    const endH = endParts[0] ?? 0;
    const endM = endParts[1] ?? 0;
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  },

  /**
   * Check rate limits for agent messages
   */
  async checkRateLimit(
    userId: string,
    agentType: AgentType,
    channel: AgentChannel,
    prefs: AgentPreferences
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await prisma.ai_agent_events.count({
      where: {
        userId,
        channel,
        createdAt: { gte: today },
        status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] },
      },
    });

    const maxDaily = channel === 'PUSH' ? prefs.maxDailyPush : prefs.maxDailyEmail;
    return todayCount < maxDaily;
  },

  // ============================================
  // Individual Agents
  // ============================================

  /**
   * 1. ONBOARDING AGENT
   * Guides new users through first 7 days
   */
  async onboardingAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    // Only for new users in first 7 days
    if (context.daysSinceCreation > 7) return null;
    if (context.onboardingCompleted && context.daysSinceCreation > 3) return null;

    // Day-based onboarding messages
    const dayMessages: Record<number, AgentMessage> = {
      0: {
        type: 'IN_APP',
        title: `Hoş geldin ${context.name}! 🧘`,
        body: 'İlk meditasyonunu yapmaya hazır mısın? Sana özel 5 dakikalık başlangıç seansı hazırladık.',
        action: { type: 'open_meditation', targetId: 'beginner-intro' },
        priority: 2,
      },
      1: {
        type: 'PUSH',
        title: 'İkinci günün kutlu olsun! ☀️',
        body: 'Düzenli pratik yapmak için en önemli adım bugün atmak. 3 dakikalık nefes egzersizi dene!',
        action: { type: 'open_content', targetId: 'breathwork' },
      },
      2: {
        type: 'IN_APP',
        title: 'Hedefini belirleyelim mi? 🎯',
        body: 'Stres azaltma, daha iyi uyku, odaklanma... Hangi hedef sana uygun?',
        action: { type: 'open_goal' },
      },
      3: {
        type: 'PUSH',
        title: '3 gün oldu! 🔥',
        body: `${context.name}, ilk 3 günü tamamladın! Şimdi streak\'ini sürdürme zamanı.`,
        action: { type: 'open_content' },
      },
      5: {
        type: 'IN_APP',
        title: 'Günlük hatırlatıcı ayarla ⏰',
        body: 'En verimli olduğun saatte meditasyon yapmak için hatırlatıcı ayarlayalım.',
        action: { type: 'open_feature', targetId: 'reminders' },
      },
      7: {
        type: 'PUSH',
        title: 'İlk haftanı tamamladın! 🎉',
        body: 'Harika gidiyorsun! Artık düzenli pratik yapan birisin. Premium ile daha fazlasını keşfet.',
        action: { type: 'open_plan' },
      },
    };

    return dayMessages[context.daysSinceCreation] || null;
  },

  /**
   * 2. PERSONALIZATION AGENT
   * Personalized content recommendations
   */
  async personalizationAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    // Get today's mood if available
    if (context.todaysMood) {
      const moodSuggestions: Record<number, { content: string; category: string }> = {
        1: { content: 'Ruh halini yükseltecek pozitif enerji meditasyonu', category: 'meditation' },
        2: { content: 'Kaygı azaltan nefes egzersizimiz tam sana göre', category: 'breathwork' },
        3: { content: 'Bugün için dengeleyici bir meditasyon', category: 'meditation' },
        4: { content: 'Enerjini sürdürmek için hafif bir yoga akışı', category: 'yoga' },
        5: { content: 'Mutluluğunu sürdürmek için şükran meditasyonu yap', category: 'meditation' },
      };

      const moodScore = Math.round(context.todaysMood);
      const suggestion = moodSuggestions[moodScore];

      if (suggestion) {
        return {
          type: 'IN_APP',
          title: `Bugün nasıl hissediyorsun ${context.name}? 💜`,
          body: suggestion.content,
          action: { type: 'open_content', targetId: suggestion.category },
        };
      }
    }

    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) {
      return {
        type: 'IN_APP',
        title: 'Günaydın! ☀️',
        body: `${context.favoriteCategory === 'yoga' ? 'Sabah yogası' : 'Sabah meditasyonu'} ile güne enerjik başla!`,
        action: { type: 'open_content', targetId: context.favoriteCategory || 'meditation' },
      };
    } else if (hour >= 22 || hour < 6) {
      return {
        type: 'IN_APP',
        title: 'İyi geceler 🌙',
        body: 'Rahat bir uyku için uyku hikayesi veya rahatlama meditasyonu öneriyoruz.',
        action: { type: 'open_sleep' },
      };
    }

    // Goal-based suggestions
    if (context.goals.includes('STRESS_RELIEF')) {
      return {
        type: 'IN_APP',
        title: 'Stres azaltma önerisi 🧘',
        body: '10 dakikalık stres giderici meditasyonumuzu denedin mi?',
        action: { type: 'open_meditation', targetId: 'stress-relief' },
      };
    }

    return null;
  },

  /**
   * 3. RETENTION AGENT
   * Re-engage inactive users, prevent churn
   */
  async retentionAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    const { daysSinceActive, streakDays, name, favoriteCategory } = context;
    const now = new Date();

    // Streak about to be lost (user was active yesterday but not today after 6pm)
    if (daysSinceActive === 1 && streakDays > 3 && now.getHours() >= 18) {
      return {
        type: 'PUSH',
        title: `🔥 ${streakDays} günlük serin tehlikede!`,
        body: 'Bugün sadece 1 dakikalık nefes egzersizi bile serini korur. Hadi!',
        action: { type: 'open_content', targetId: 'breathwork' },
        priority: 2,
      };
    }

    // 3 days inactive - gentle reminder
    if (daysSinceActive >= 3 && daysSinceActive < 7) {
      return {
        type: 'PUSH',
        title: `${name}, seni özledik! 💜`,
        body: this.getRetentionMessage(context, 'gentle'),
        action: { type: 'open_content', targetId: favoriteCategory || undefined },
      };
    }

    // 7 days inactive - motivational
    if (daysSinceActive >= 7 && daysSinceActive < 14) {
      return {
        type: 'PUSH',
        title: 'Yeniden başlamak için mükemmel bir gün! 🌟',
        body: this.getRetentionMessage(context, 'motivational'),
        action: { type: 'open_content' },
        priority: 1,
      };
    }

    // 14 days inactive - win-back
    if (daysSinceActive >= 14 && daysSinceActive < 30) {
      return {
        type: 'EMAIL',
        title: `${name}, seni geri kazanmak istiyoruz 💝`,
        body: 'Sana özel bir sürprizimiz var! Uygulamaya dön ve keşfet.',
        action: { type: 'open_content' },
        metadata: { campaign: 'win_back_14' },
      };
    }

    // 30+ days inactive - last chance
    if (daysSinceActive >= 30) {
      return {
        type: 'EMAIL',
        title: 'Wellness yolculuğuna devam etmeye hazır mısın?',
        body: '30 günü aşkın süredir seni göremedik. Premium\'da %50 indirim seni bekliyor!',
        action: { type: 'open_plan' },
        metadata: { campaign: 'win_back_30', discount: 50 },
      };
    }

    return null;
  },

  /**
   * 4. MOOD & WELLNESS AGENT
   * Mental health tracking and support
   */
  async moodWellnessAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    // Declining mood trend alert
    if (context.lastMoodTrend === 'declining' && context.weeklyMoodAverage && context.weeklyMoodAverage < 3) {
      return {
        type: 'IN_APP',
        title: 'Seni düşünüyoruz 💙',
        body: 'Son günlerde biraz zor geçiyor gibi görünüyor. Destekleyici bir meditasyona ne dersin?',
        action: { type: 'open_meditation', targetId: 'emotional-support' },
        priority: 1,
        metadata: { concernType: 'declining_mood' },
      };
    }

    // Positive mood celebration
    if (context.lastMoodTrend === 'improving' && context.weeklyMoodAverage && context.weeklyMoodAverage >= 4) {
      return {
        type: 'IN_APP',
        title: 'Harika gidiyorsun! 🎉',
        body: '7 gün boyunca pozitif mood! Bu başarıyı kutlayalım.',
        action: { type: 'open_journal' },
      };
    }

    // Remind to log mood
    const lastMoodEntry = await prisma.mood_entries.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastMoodEntry || this.daysDiff(lastMoodEntry.createdAt, new Date()) >= 2) {
      return {
        type: 'IN_APP',
        title: 'Bugün nasıl hissediyorsun? 🌈',
        body: 'Mood\'unu kaydet ve kendini daha iyi anla.',
        action: { type: 'open_feature', targetId: 'mood' },
      };
    }

    return null;
  },

  /**
   * 5. STREAK & GAMIFICATION AGENT
   * Motivation through streaks and achievements
   */
  async streakGamificationAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    const { streakDays, longestStreak, name } = context;

    // Streak milestones
    const milestones = [7, 14, 21, 30, 50, 100, 365];
    if (milestones.includes(streakDays)) {
      return {
        type: 'PUSH',
        title: `🎉 ${streakDays} gün! İnanılmaz!`,
        body: `${name}, ${streakDays} günlük seriye ulaştın! Bu harika bir başarı. Devam et!`,
        action: { type: 'open_feature', targetId: 'achievements' },
        priority: 1,
      };
    }

    // About to break personal record
    if (streakDays === longestStreak && streakDays > 0) {
      return {
        type: 'PUSH',
        title: '🏆 Kişisel rekoruna ulaştın!',
        body: `${streakDays} gün - en uzun serin! Yarın yeni bir rekor kırabilirsin.`,
        action: { type: 'open_content' },
      };
    }

    // Check for completed goals
    const recentGoal = await prisma.user_goals.findFirst({
      where: {
        userId,
        isCompleted: true,
        completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentGoal) {
      return {
        type: 'PUSH',
        title: '🏆 Hedef tamamlandı!',
        body: `Tebrikler ${name}! Hedefine ulaştın. Yeni bir hedef belirlemeye ne dersin?`,
        action: { type: 'open_goal' },
      };
    }

    // Weekly progress summary (on Sundays)
    if (new Date().getDay() === 0) {
      const weeklyMinutes = Math.round(context.totalMinutes);
      if (weeklyMinutes > 0) {
        return {
          type: 'PUSH',
          title: '📊 Haftalık özetin hazır!',
          body: `Bu hafta ${weeklyMinutes} dakika pratik yaptın. ${
            weeklyMinutes > 60 ? 'Harika gidiyorsun!' : 'Gelecek hafta hedefini yükseltmeye ne dersin?'
          }`,
          action: { type: 'open_feature', targetId: 'stats' },
        };
      }
    }

    return null;
  },

  /**
   * 6. SUBSCRIPTION AGENT
   * Convert free users, manage renewals
   */
  async subscriptionAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    const { subscriptionTier, subscriptionExpiresAt, totalMinutes, name } = context;

    // Free user with significant usage
    if (subscriptionTier === 'FREE' && totalMinutes > 120) {
      const recommendation = await subscriptionRecommendationService.recommendPlan(userId);

      if (recommendation.matchScore > 70) {
        return {
          type: 'IN_APP',
          title: `${name}, sana özel bir plan bulduk! 🎁`,
          body: recommendation.reason,
          action: { type: 'open_plan', targetId: recommendation.recommendedTier },
          metadata: {
            recommendedPlan: recommendation.recommendedTier,
            matchScore: recommendation.matchScore,
          },
        };
      }
    }

    // Premium expiring soon
    if (subscriptionExpiresAt) {
      const daysUntilExpiry = this.daysDiff(new Date(), subscriptionExpiresAt);

      if (daysUntilExpiry === 7) {
        return {
          type: 'EMAIL',
          title: 'Aboneliğin 7 gün sonra yenileniyor',
          body: `${name}, Premium aboneliğin yakında yenileniyor. Her şey yolunda!`,
          metadata: { type: 'renewal_reminder' },
        };
      }

      if (daysUntilExpiry === 1) {
        return {
          type: 'PUSH',
          title: 'Aboneliğin yarın yenileniyor 💳',
          body: 'Premium avantajlarından kesintisiz faydalanmaya devam edeceksin.',
          action: { type: 'open_feature', targetId: 'subscription' },
        };
      }

      // Expired
      if (daysUntilExpiry < 0) {
        return {
          type: 'PUSH',
          title: 'Premium\'u özleyeceksin 😢',
          body: 'Aboneliğin sona erdi. Yeniden abone ol ve kaldığın yerden devam et!',
          action: { type: 'open_plan' },
          priority: 1,
        };
      }
    }

    // Check if user tried premium features
    const stats = await subscriptionRecommendationService.getUserUsageStats(userId, 7);
    if (subscriptionTier === 'FREE' && (stats.usedAICoach || stats.usedOfflineDownload)) {
      return {
        type: 'IN_APP',
        title: 'Premium özellikleri sevdin mi? 💎',
        body: 'AI koç ve offline indirme gibi özellikler Premium ile sınırsız!',
        action: { type: 'open_plan', targetId: 'PREMIUM' },
      };
    }

    return null;
  },

  /**
   * 7. CONTENT SCHEDULING AGENT
   * Optimal content timing and daily content
   */
  async contentSchedulingAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    const prefs = await this.getUserPreferences(userId);
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Check if it's user's preferred time
    if (prefs.preferredTime) {
      const prefParts = prefs.preferredTime.split(':').map(Number);
      const prefH = prefParts[0] ?? 9;
      const prefM = prefParts[1] ?? 0;
      if (hour === prefH && minute >= prefM && minute < prefM + 30) {
        return {
          type: 'PUSH',
          title: 'Günlük meditasyon zamanı! ⏰',
          body: `${context.name}, favori saatinde meditasyon yapmayı unutma.`,
          action: { type: 'open_content', targetId: context.favoriteCategory || 'meditation' },
        };
      }
    }

    // Daily content at optimal time
    const dayOfWeek = now.getDay();
    const dailyThemes: Record<number, { title: string; category: string }> = {
      0: { title: 'Pazar Huzuru', category: 'meditation' },
      1: { title: 'Pazartesi Motivasyonu', category: 'breathwork' },
      2: { title: 'Salı Odaklanması', category: 'meditation' },
      3: { title: 'Çarşamba Enerjisi', category: 'yoga' },
      4: { title: 'Perşembe Şükranı', category: 'meditation' },
      5: { title: 'Cuma Rahatlığı', category: 'breathwork' },
      6: { title: 'Cumartesi Keşfi', category: 'yoga' },
    };

    const theme = dailyThemes[dayOfWeek];
    if (hour === 9 && theme) {
      return {
        type: 'IN_APP',
        title: `${theme.title} 🌟`,
        body: `Bugünün teması: ${theme.title.toLowerCase()}. Hazır mısın?`,
        action: { type: 'open_content', targetId: theme.category },
      };
    }

    return null;
  },

  /**
   * 8. SLEEP AGENT
   * Sleep assistant and bedtime reminders
   */
  async sleepAgent(userId: string): Promise<AgentMessage | null> {
    const context = await this.getUserContext(userId);
    if (!context) return null;

    const now = new Date();
    const hour = now.getHours();

    // Bedtime reminder (10 PM)
    if (hour === 22) {
      // Get last sleep story
      const lastSleepStory = await prisma.sleep_story_progress.findFirst({
        where: { userId },
        orderBy: { lastPlayedAt: 'desc' },
        include: { story: true },
      });

      if (lastSleepStory) {
        return {
          type: 'PUSH',
          title: 'Yatma vakti yaklaşıyor 😴',
          body: `Dün gece "${lastSleepStory.story.title}" dinledin. Bu gece farklı bir hikaye dene?`,
          action: { type: 'open_sleep' },
        };
      }

      return {
        type: 'PUSH',
        title: 'İyi geceler 🌙',
        body: 'Rahat bir uyku için uyku hikayesi veya rahatlama meditasyonu öneriyoruz.',
        action: { type: 'open_sleep' },
      };
    }

    // Check sleep quality (if tracking enabled)
    const recentSleep = await prisma.sleep_tracking.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (recentSleep && recentSleep.quality && recentSleep.quality < 3) {
      return {
        type: 'IN_APP',
        title: 'Uyku kaliteni artıralım 💤',
        body: 'Son günlerde uyku kaliten düşük. Yatmadan önce rahatlama meditasyonu dene.',
        action: { type: 'open_meditation', targetId: 'sleep-preparation' },
      };
    }

    return null;
  },

  /**
   * 9. INSTRUCTOR AGENT
   * Insights for instructors about their content
   */
  async instructorAgent(userId: string): Promise<AgentMessage | null> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role as string) !== 'INSTRUCTOR') return null;

    const instructorProfile = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructorProfile) return null;

    // Get weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weeklyRatings = await prisma.instructor_reviews.findMany({
      where: {
        instructorId: instructorProfile.id,
        createdAt: { gte: weekAgo },
      },
    });

    const avgRating = weeklyRatings.length > 0
      ? weeklyRatings.reduce((s, r) => s + r.rating, 0) / weeklyRatings.length
      : 0;

    if (new Date().getDay() === 1) { // Monday
      return {
        type: 'EMAIL',
        title: 'Haftalık performans raporun hazır 📊',
        body: `Bu hafta ${weeklyRatings.length} yeni yorum aldın. Ortalama puan: ${avgRating.toFixed(1)}⭐`,
        action: { type: 'open_feature', targetId: 'instructor-dashboard' },
        metadata: {
          newReviews: weeklyRatings.length,
          avgRating,
        },
      };
    }

    // Alert for new reviews
    const latestReview = weeklyRatings[0];
    if (latestReview && latestReview.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return {
        type: 'PUSH',
        title: 'Yeni yorum aldın! ⭐',
        body: `Bir öğrencin içeriğine ${latestReview.rating} yıldız verdi.`,
        action: { type: 'open_feature', targetId: 'reviews' },
      };
    }

    return null;
  },

  /**
   * 10. SUPPORT AGENT
   * AI-powered support chatbot responses
   */
  async supportAgent(userId: string, query?: string): Promise<AgentMessage | null> {
    if (!query) return null;

    const context = await this.getUserContext(userId);
    if (!context) return null;

    // Check if AI is available
    const aiAvailable = await aiService.isProviderAvailable('openai') ||
                        await aiService.isProviderAvailable('anthropic');

    if (aiAvailable) {
      try {
        const { response } = await aiService.chat([
          {
            role: 'user',
            content: query,
          },
        ], {
          systemPrompt: `Sen bir yoga ve meditasyon uygulamasının destek asistanısın.
Kullanıcı adı: ${context.name}
Abonelik: ${context.subscriptionTier}
Kısa, yardımcı ve samimi cevaplar ver. Türkçe konuş.`,
          maxTokens: 200,
        });

        return {
          type: 'IN_APP',
          title: 'Destek Yanıtı',
          body: response,
          metadata: { query, aiGenerated: true },
        };
      } catch (error) {
        logger.error({ err: error }, 'Support agent AI failed');
      }
    }

    // Fallback FAQ responses
    const faq: Record<string, string> = {
      'premium': 'Premium abonelik için Ayarlar > Abonelik bölümüne git.',
      'iptal': 'Aboneliğini iptal etmek için Ayarlar > Abonelik > İptal Et adımlarını takip et.',
      'şifre': 'Şifreni değiştirmek için Ayarlar > Güvenlik > Şifre Değiştir bölümüne git.',
      'indirme': 'İçerikleri indirmek için Premium abonelik gerekiyor.',
    };

    for (const [keyword, answer] of Object.entries(faq)) {
      if (query.toLowerCase().includes(keyword)) {
        return {
          type: 'IN_APP',
          title: 'Yardım',
          body: answer,
        };
      }
    }

    return {
      type: 'IN_APP',
      title: 'Destek',
      body: 'Sorunuz için destek@app.com adresine email atabilir veya uygulama içi destek formunu kullanabilirsiniz.',
    };
  },

  // ============================================
  // Orchestration
  // ============================================

  /**
   * Process all agents for a user and return prioritized messages
   */
  async processAgents(userId: string): Promise<AgentMessage[]> {
    const prefs = await this.getUserPreferences(userId);
    const messages: AgentMessage[] = [];

    // Check quiet hours
    if (this.isQuietHours(prefs)) {
      return [];
    }

    // Run all agents in parallel
    const results = await Promise.allSettled([
      this.onboardingAgent(userId),
      this.personalizationAgent(userId),
      this.retentionAgent(userId),
      this.moodWellnessAgent(userId),
      this.streakGamificationAgent(userId),
      this.subscriptionAgent(userId),
      this.contentSchedulingAgent(userId),
      this.sleepAgent(userId),
      this.instructorAgent(userId),
    ]);

    // Collect successful results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        messages.push(result.value);
      }
    }

    // Sort by priority (higher first)
    messages.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Filter by channel preferences and rate limits
    const filteredMessages: AgentMessage[] = [];
    for (const msg of messages) {
      if (msg.type === 'PUSH' && !prefs.pushEnabled) continue;
      if (msg.type === 'EMAIL' && !prefs.emailEnabled) continue;
      if (msg.type === 'IN_APP' && !prefs.inAppEnabled) continue;
      if (msg.type === 'SMS' && !prefs.smsEnabled) continue;

      // Check rate limit
      const agentType = this.inferAgentType(msg);
      const withinLimit = await this.checkRateLimit(userId, agentType, msg.type, prefs);
      if (withinLimit) {
        filteredMessages.push(msg);
      }
    }

    // Log agent activity
    if (filteredMessages.length > 0) {
      await prisma.integration_logs.create({
        data: {
          category: 'ai',
          provider: 'agent',
          action: 'process_agents',
          status: 'success',
          message: `Generated ${filteredMessages.length} messages`,
          metadata: { messageTypes: filteredMessages.map((m) => m.type) },
          createdBy: userId,
        },
      });
    }

    return filteredMessages;
  },

  /**
   * Save agent event to database
   */
  async saveAgentEvent(
    userId: string,
    agentType: AgentType,
    message: AgentMessage
  ): Promise<string> {
    const event = await prisma.ai_agent_events.create({
      data: {
        userId,
        agentType,
        channel: message.type,
        eventType: 'agent_triggered',
        title: message.title,
        body: message.body,
        action: message.action as any,
        payload: message.metadata as any,
        priority: message.priority || 0,
        scheduledAt: message.scheduledAt,
        status: message.scheduledAt ? 'SCHEDULED' : 'PENDING',
      },
    });

    return event.id;
  },

  /**
   * Update event status
   */
  async updateEventStatus(
    eventId: string,
    status: AgentEventStatus,
    error?: string
  ): Promise<void> {
    const updateData: any = { status };

    switch (status) {
      case 'SENT':
        updateData.sentAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
      case 'OPENED':
        updateData.openedAt = new Date();
        break;
      case 'CLICKED':
        updateData.clickedAt = new Date();
        break;
      case 'DISMISSED':
        updateData.dismissedAt = new Date();
        break;
      case 'FAILED':
        updateData.errorMessage = error;
        break;
    }

    await prisma.ai_agent_events.update({
      where: { id: eventId },
      data: updateData,
    });
  },

  /**
   * Batch process agents for multiple users (for cron job)
   */
  async batchProcessAgents(limit: number = 100): Promise<Map<string, AgentMessage[]>> {
    const results = new Map<string, AgentMessage[]>();

    // Get users who need processing
    const userIds = await this.getUsersForAgentProcessing(limit);

    for (const userId of userIds) {
      try {
        const messages = await this.processAgents(userId);
        if (messages.length > 0) {
          results.set(userId, messages);

          // Save events
          for (const message of messages) {
            const agentType = this.inferAgentType(message);
            await this.saveAgentEvent(userId, agentType, message);
          }
        }
      } catch (error) {
        logger.error({ err: error, userId }, 'Agent processing failed for user');
      }
    }

    // Update analytics
    await this.updateDailyAnalytics(results);

    return results;
  },

  /**
   * Get users who need agent processing
   */
  async getUsersForAgentProcessing(limit: number = 100): Promise<string[]> {
    // Get users who haven't been processed in last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const users = await prisma.users.findMany({
      where: {
        isActive: true,
        NOT: {
          integration_logs_created: {
            some: {
              category: 'ai',
              provider: 'agent',
              createdAt: { gte: sixHoursAgo },
            },
          },
        },
      },
      select: { id: true },
      take: limit,
    });

    return users.map((u) => u.id);
  },

  // ============================================
  // Analytics
  // ============================================

  /**
   * Update daily analytics
   */
  async updateDailyAnalytics(results: Map<string, AgentMessage[]>): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = new Map<string, { sent: number; channel: AgentChannel }>();

    Array.from(results.values()).forEach((messages) => {
      for (const msg of messages) {
        const agentType = this.inferAgentType(msg);
        const key = `${agentType}_${msg.type}`;
        const current = stats.get(key) || { sent: 0, channel: msg.type };
        current.sent++;
        stats.set(key, current);
      }
    });

    for (const [key, data] of Array.from(stats.entries())) {
      const [agentType] = key.split('_');
      await prisma.ai_agent_analytics.upsert({
        where: {
          date_agentType_channel: {
            date: today,
            agentType: agentType as AgentType,
            channel: data.channel,
          },
        },
        create: {
          date: today,
          agentType: agentType as AgentType,
          channel: data.channel,
          totalSent: data.sent,
        },
        update: {
          totalSent: { increment: data.sent },
        },
      });
    }
  },

  /**
   * Get agent analytics for date range
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<any[]> {
    return prisma.ai_agent_analytics.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });
  },

  // ============================================
  // Helpers
  // ============================================

  getRetentionMessage(context: UserContext, type: 'gentle' | 'motivational'): string {
    const messages = {
      gentle: [
        `${context.favoriteCategory === 'meditation' ? 'Bugün birkaç dakika meditasyon yaparak zihnini dinlendirmeye ne dersin?' : 'Bugün biraz yoga ile bedenini esnetmeye ne dersin?'}`,
        `${context.streakDays > 0 ? `${context.streakDays} günlük serini korumak için` : 'Yeni bir başlangıç için'} sadece 5 dakika yeterli!`,
        'Küçük adımlar büyük değişimler yaratır. Bugün başla! 🌟',
      ],
      motivational: [
        'Her gün yeni bir başlangıç için mükemmel. Bugün o gün olabilir!',
        'Kendine ayırdığın 5 dakika, tüm gününü değiştirebilir.',
        'En iyi zaman başlamak için şimdi. Seni bekliyoruz! 💪',
      ],
    };

    return messages[type][Math.floor(Math.random() * messages[type].length)] || '';
  },

  inferAgentType(message: AgentMessage): AgentType {
    const title = (message.title || '').toLowerCase();
    const body = (message.body || '').toLowerCase();

    if (title.includes('hoş geldin') || title.includes('gün oldu')) return 'ONBOARDING';
    if (title.includes('özledik') || title.includes('yeniden')) return 'RETENTION';
    if (title.includes('streak') || title.includes('seri')) return 'STREAK_GAMIFICATION';
    if (title.includes('mood') || title.includes('hissediyorsun')) return 'MOOD_WELLNESS';
    if (title.includes('premium') || title.includes('abonelik')) return 'SUBSCRIPTION';
    if (title.includes('uyku') || title.includes('gece')) return 'SLEEP';
    if (title.includes('performans') || title.includes('rapor')) return 'INSTRUCTOR';
    if (body.includes('öneri') || body.includes('dene')) return 'PERSONALIZATION';
    if (title.includes('zaman') || title.includes('günlük')) return 'CONTENT_SCHEDULING';

    return 'PERSONALIZATION';
  },

  daysDiff(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  },
};
