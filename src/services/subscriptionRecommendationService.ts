/**
 * Subscription Recommendation Service
 * Analyzes user behavior and recommends the best subscription plan
 * Like Calm/Headspace - suggests plans based on what user actually uses
 */

import { prisma } from '../utils/database';
import { SubscriptionTier } from '@prisma/client';
import { logger } from '../utils/logger';

interface UserUsageStats {
  // Time spent (in minutes)
  meditationMinutes: number;
  yogaMinutes: number;
  breathworkMinutes: number;
  sleepMinutes: number;
  pilatesMinutes: number;

  // Session counts
  meditationSessions: number;
  yogaSessions: number;
  breathworkSessions: number;
  sleepSessions: number;
  pilatesSessions: number;

  // Feature usage
  usedAICoach: boolean;
  usedOfflineDownload: boolean;
  usedLiveClasses: boolean;

  // Engagement
  totalDaysActive: number;
  streakDays: number;
  lastActiveAt: Date | null;
}

interface PlanRecommendation {
  recommendedTier: SubscriptionTier;
  reason: string;
  savings: number; // Potential savings vs buying everything
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  matchScore: number; // 0-100 how well plan matches usage
}

interface ContentCategory {
  category: 'meditation' | 'yoga' | 'breathwork' | 'sleep' | 'pilates' | 'soundscapes';
  usageMinutes: number;
  sessionCount: number;
  percentage: number;
}

export const subscriptionRecommendationService = {
  /**
   * Get user's content usage statistics
   */
  async getUserUsageStats(userId: string, days: number = 30): Promise<UserUsageStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get meditation sessions
    const meditationSessions = await prisma.meditation_sessions.findMany({
      where: {
        userId,
        completedAt: { gte: since },
      },
      select: {
        actualDuration: true,
        startedAt: true,
      },
    });

    // Get breathwork sessions
    const breathworkSessions = await prisma.breathwork_sessions.findMany({
      where: {
        userId,
        completed: true,
        createdAt: { gte: since },
      },
      select: {
        duration: true,
        startedAt: true,
      },
    });

    // Get video progress (yoga/pilates)
    // Note: video_progress doesn't have a direct video relation
    // We track progress by lessonId and lessonType
    const videoProgress = await prisma.video_progress.findMany({
      where: {
        userId,
        updatedAt: { gte: since },
      },
      select: {
        lessonId: true,
        lessonType: true,
        currentTime: true,
        duration: true,
        completed: true,
      },
    });

    // Calculate stats
    const allSessions = [
      ...meditationSessions.map(s => s.startedAt),
      ...breathworkSessions.map(s => s.startedAt),
    ].filter(Boolean);

    const stats: UserUsageStats = {
      meditationMinutes: meditationSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      // Note: Without video relation, we can't determine yoga vs pilates
      // We combine all video progress as yoga for now
      yogaMinutes: videoProgress
        .reduce((sum, v) => sum + (v.currentTime || 0) / 60, 0),
      breathworkMinutes: breathworkSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      sleepMinutes: 0, // No sleep sessions tracking yet
      pilatesMinutes: 0, // Cannot distinguish pilates without video relation

      meditationSessions: meditationSessions.length,
      yogaSessions: videoProgress.length,
      breathworkSessions: breathworkSessions.length,
      sleepSessions: 0, // No sleep sessions tracking yet
      pilatesSessions: 0, // Cannot distinguish pilates without video relation

      usedAICoach: false, // Will check from AI usage logs
      usedOfflineDownload: false, // Will check from downloads
      usedLiveClasses: false, // Will check from live class participation

      totalDaysActive: new Set(allSessions.map((s) => s?.toDateString())).size,
      streakDays: 0, // Calculate from streak data
      lastActiveAt: allSessions.length > 0 ? allSessions.sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null : null,
    };

    // Check AI usage
    const aiUsage = await prisma.integration_logs.count({
      where: {
        createdBy: userId,
        category: 'ai',
        createdAt: { gte: since },
      },
    });
    stats.usedAICoach = aiUsage > 0;

    // Check offline downloads
    const downloads = await prisma.offline_downloads.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
    stats.usedOfflineDownload = downloads > 0;

    // Check live class participation
    const liveParticipation = await prisma.live_stream_participants.count({
      where: {
        userId,
        joinedAt: { gte: since },
      },
    });
    stats.usedLiveClasses = liveParticipation > 0;

    // Get streak
    const engagementStats = await prisma.user_engagement_stats.findUnique({
      where: { userId },
    });
    stats.streakDays = engagementStats?.currentStreak || 0;

    return stats;
  },

  /**
   * Get usage breakdown by category
   */
  async getCategoryBreakdown(userId: string, days: number = 30): Promise<ContentCategory[]> {
    const stats = await this.getUserUsageStats(userId, days);

    const totalMinutes =
      stats.meditationMinutes +
      stats.yogaMinutes +
      stats.breathworkMinutes +
      stats.sleepMinutes +
      stats.pilatesMinutes;

    if (totalMinutes === 0) {
      return [];
    }

    const categories: ContentCategory[] = [
      {
        category: 'meditation',
        usageMinutes: stats.meditationMinutes,
        sessionCount: stats.meditationSessions,
        percentage: (stats.meditationMinutes / totalMinutes) * 100,
      },
      {
        category: 'yoga',
        usageMinutes: stats.yogaMinutes,
        sessionCount: stats.yogaSessions,
        percentage: (stats.yogaMinutes / totalMinutes) * 100,
      },
      {
        category: 'breathwork',
        usageMinutes: stats.breathworkMinutes,
        sessionCount: stats.breathworkSessions,
        percentage: (stats.breathworkMinutes / totalMinutes) * 100,
      },
      {
        category: 'sleep',
        usageMinutes: stats.sleepMinutes,
        sessionCount: stats.sleepSessions,
        percentage: (stats.sleepMinutes / totalMinutes) * 100,
      },
      {
        category: 'pilates',
        usageMinutes: stats.pilatesMinutes,
        sessionCount: stats.pilatesSessions,
        percentage: (stats.pilatesMinutes / totalMinutes) * 100,
      },
    ];

    // Sort by usage
    return categories.sort((a, b) => b.usageMinutes - a.usageMinutes);
  },

  /**
   * Recommend best subscription plan based on usage
   */
  async recommendPlan(userId: string): Promise<PlanRecommendation> {
    const stats = await this.getUserUsageStats(userId, 30);
    const categories = await this.getCategoryBreakdown(userId, 30);

    // Get available plans
    const plans = await prisma.subscription_plans.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    // Calculate category dominance
    const meditationGroup = stats.meditationMinutes + stats.breathworkMinutes + stats.sleepMinutes;
    const yogaGroup = stats.yogaMinutes + stats.pilatesMinutes;
    const totalMinutes = meditationGroup + yogaGroup;

    // Default recommendation
    let recommendation: PlanRecommendation = {
      recommendedTier: 'FREE' as SubscriptionTier,
      reason: 'Henüz yeterli kullanım verisi yok',
      savings: 0,
      features: ['Sınırlı içerik', 'Temel meditasyonlar'],
      monthlyPrice: 0,
      yearlyPrice: 0,
      matchScore: 50,
    };

    // Not enough usage - stay free
    if (totalMinutes < 60) {
      return recommendation;
    }

    const meditationPercentage = (meditationGroup / totalMinutes) * 100;
    const yogaPercentage = (yogaGroup / totalMinutes) * 100;

    // Determine best plan
    if (meditationPercentage > 70 && yogaPercentage < 30) {
      // Heavy meditation user
      const plan = plans.find((p) => p.tier === 'MEDITATION');
      if (plan) {
        recommendation = {
          recommendedTier: 'MEDITATION' as SubscriptionTier,
          reason: `Kullanımınızın %${Math.round(meditationPercentage)}'i meditasyon ve nefes egzersizleri. Meditation planı size en uygun!`,
          savings: Number(plans.find((p) => p.tier === 'PREMIUM')?.priceMonthly || 0) - Number(plan.priceMonthly),
          features: [
            'Tüm meditasyonlar',
            'Nefes egzersizleri',
            'Uyku hikayeleri',
            'Doğa sesleri',
            'Reklamsız',
          ],
          monthlyPrice: Number(plan.priceMonthly),
          yearlyPrice: Number(plan.priceYearly),
          matchScore: 90,
        };
      }
    } else if (yogaPercentage > 70 && meditationPercentage < 30) {
      // Heavy yoga user
      const plan = plans.find((p) => p.tier === 'YOGA');
      if (plan) {
        recommendation = {
          recommendedTier: 'YOGA' as SubscriptionTier,
          reason: `Kullanımınızın %${Math.round(yogaPercentage)}'i yoga ve pilates. Yoga planı size en uygun!`,
          savings: Number(plans.find((p) => p.tier === 'PREMIUM')?.priceMonthly || 0) - Number(plan.priceMonthly),
          features: [
            'Tüm yoga dersleri',
            'Pilates dersleri',
            'Canlı dersler',
            'Eğitmen programları',
            'Reklamsız',
          ],
          monthlyPrice: Number(plan.priceMonthly),
          yearlyPrice: Number(plan.priceYearly),
          matchScore: 90,
        };
      }
    } else {
      // Mixed usage - recommend Premium
      const plan = plans.find((p) => p.tier === 'PREMIUM');
      if (plan) {
        recommendation = {
          recommendedTier: 'PREMIUM' as SubscriptionTier,
          reason: 'Hem meditasyon hem yoga kullanıyorsunuz. Premium ile hepsine erişin!',
          savings: 0,
          features: [
            'Tüm içerikler',
            'AI kişisel koç',
            'Offline indirme',
            'Canlı dersler',
            'Öncelikli destek',
          ],
          monthlyPrice: Number(plan.priceMonthly),
          yearlyPrice: Number(plan.priceYearly),
          matchScore: 85,
        };
      }
    }

    // Check if user needs AI or offline - upgrade to Premium
    if (stats.usedAICoach || stats.usedOfflineDownload) {
      const plan = plans.find((p) => p.tier === 'PREMIUM');
      if (plan && recommendation.recommendedTier !== 'PREMIUM') {
        recommendation = {
          recommendedTier: 'PREMIUM' as SubscriptionTier,
          reason: 'AI koç ve offline özelliklerini kullandığınız için Premium öneriyoruz.',
          savings: 0,
          features: [
            'Tüm içerikler',
            'AI kişisel koç',
            'Offline indirme',
            'Canlı dersler',
            'Öncelikli destek',
          ],
          monthlyPrice: Number(plan.priceMonthly),
          yearlyPrice: Number(plan.priceYearly),
          matchScore: 95,
        };
      }
    }

    return recommendation;
  },

  /**
   * Check if user has access to a specific content category
   */
  async hasAccessToCategory(
    userId: string,
    category: 'meditation' | 'yoga' | 'breathwork' | 'sleep' | 'pilates' | 'soundscapes' | 'live_classes'
  ): Promise<boolean> {
    // Get user's active subscription
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      // Free tier - limited access
      const freeCategories = ['meditation', 'breathwork']; // Free users can access basic meditation
      return freeCategories.includes(category);
    }

    const plan = subscription.plan;

    // Premium/Family/Enterprise have access to everything
    if (['PREMIUM', 'FAMILY', 'ENTERPRISE'].includes(plan.tier)) {
      return true;
    }

    // Check if plan includes this category
    const includedCategories = plan.includedCategories || [];
    if (includedCategories.includes('all')) {
      return true;
    }

    // Meditation plan includes
    if (plan.tier === 'MEDITATION') {
      return ['meditation', 'breathwork', 'sleep', 'soundscapes'].includes(category);
    }

    // Yoga plan includes
    if (plan.tier === 'YOGA') {
      return ['yoga', 'pilates', 'live_classes'].includes(category);
    }

    return includedCategories.includes(category);
  },

  /**
   * Get all plans with recommendation scores for user
   */
  async getPlansWithScores(userId: string): Promise<
    Array<{
      plan: any;
      matchScore: number;
      isRecommended: boolean;
      savingsVsPremium: number;
    }>
  > {
    const recommendation = await this.recommendPlan(userId);
    const plans = await prisma.subscription_plans.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const premiumPrice = Number(plans.find((p) => p.tier === 'PREMIUM')?.priceMonthly || 0);

    return plans.map((plan) => ({
      plan,
      matchScore: plan.tier === recommendation.recommendedTier ? recommendation.matchScore : 50,
      isRecommended: plan.tier === recommendation.recommendedTier,
      savingsVsPremium: premiumPrice - Number(plan.priceMonthly),
    }));
  },
};
