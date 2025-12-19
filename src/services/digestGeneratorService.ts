import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// Weekly Digest Data
// ============================================

export interface WeeklyDigestData {
  completedSessions: number;
  totalMinutes: number;
  currentStreak: number;
  newContent: string;
  recommendations: string;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Generate weekly digest data for a user
 */
export async function generateWeeklyDigestData(userId: string): Promise<WeeklyDigestData> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get completed sessions this week
  const completedSessions = await prisma.daily_checks.count({
    where: {
      userId,
      date: {
        gte: weekStart,
        lte: now,
      },
    },
  });

  // Get total practice minutes from video progress
  const videoProgress = await prisma.video_progress.findMany({
    where: {
      userId,
      lastWatchedAt: {
        gte: weekStart,
        lte: now,
      },
    },
    select: {
      currentTime: true,
    },
  });

  const totalMinutes = Math.round(
    videoProgress.reduce((sum, vp) => sum + vp.currentTime, 0) / 60
  );

  // Get current streak from engagement stats
  const engagementStats = await prisma.user_engagement_stats.findUnique({
    where: { userId },
  });

  const currentStreak = engagementStats?.currentStreak || 0;

  // Get new content tried this week
  const newSessions = await prisma.video_progress.findMany({
    where: {
      userId,
      createdAt: {
        gte: weekStart,
        lte: now,
      },
    },
    distinct: ['lessonId'],
    take: 5,
    select: {
      lessonId: true,
      lessonType: true,
    },
  });

  let newContent = '';
  if (newSessions.length > 0) {
    newContent = `${newSessions.length} yeni içerik denedin`;
  }

  // Generate recommendations based on activity
  const recommendations = await generateRecommendations(userId);

  return {
    completedSessions,
    totalMinutes,
    currentStreak,
    newContent,
    recommendations,
    weekStart,
    weekEnd: now,
  };
}

// ============================================
// Monthly Digest Data
// ============================================

export interface MonthlyDigestData {
  monthName: string;
  completedSessions: number;
  totalMinutes: number;
  longestStreak: number;
  programsStarted: number;
  achievements: string;
  yearlyMinutes: number;
  monthStart: Date;
  monthEnd: Date;
  topPracticeTypes: { type: string; count: number }[];
}

/**
 * Generate monthly digest data for a user
 */
export async function generateMonthlyDigestData(userId: string): Promise<MonthlyDigestData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Turkish month names
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const monthName = monthNames[now.getMonth()]!;

  // Get completed sessions this month
  const completedSessions = await prisma.daily_checks.count({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: now,
      },
    },
  });

  // Get total practice minutes this month
  const monthlyProgress = await prisma.video_progress.findMany({
    where: {
      userId,
      lastWatchedAt: {
        gte: monthStart,
        lte: now,
      },
    },
    select: {
      currentTime: true,
    },
  });

  const totalMinutes = Math.round(
    monthlyProgress.reduce((sum, vp) => sum + vp.currentTime, 0) / 60
  );

  // Get longest streak from engagement stats
  const engagementStats = await prisma.user_engagement_stats.findUnique({
    where: { userId },
  });

  const longestStreak = engagementStats?.longestStreak || 0;

  // Get programs started this month
  const programsStarted = await prisma.video_progress.groupBy({
    by: ['lessonId'],
    where: {
      userId,
      lessonType: 'PROGRAM_SESSION',
      createdAt: {
        gte: monthStart,
        lte: now,
      },
    },
  });

  // Get yearly minutes
  const yearlyProgress = await prisma.video_progress.findMany({
    where: {
      userId,
      lastWatchedAt: {
        gte: yearStart,
        lte: now,
      },
    },
    select: {
      currentTime: true,
    },
  });

  const yearlyMinutes = Math.round(
    yearlyProgress.reduce((sum, vp) => sum + vp.currentTime, 0) / 60
  );

  // Get achievements/badges (from completed challenges)
  const completedChallenges = await prisma.challenge_enrollments.findMany({
    where: {
      userId,
      joinedAt: {
        gte: monthStart,
        lte: now,
      },
    },
    include: {
      challenges: {
        select: {
          title: true,
          targetDays: true,
        },
      },
    },
  });

  // Check which challenges were actually completed
  const achievements: string[] = [];
  for (const enrollment of completedChallenges) {
    const completedDays = await prisma.daily_checks.count({
      where: {
        userId,
        challengeId: enrollment.challengeId,
      },
    });

    if (completedDays >= enrollment.challenges.targetDays) {
      achievements.push(enrollment.challenges.title);
    }
  }

  const achievementsStr = achievements.length > 0
    ? achievements.join(', ')
    : '';

  // Get top practice types
  const practiceTypes = await prisma.video_progress.groupBy({
    by: ['lessonType'],
    where: {
      userId,
      lastWatchedAt: {
        gte: monthStart,
        lte: now,
      },
    },
    _count: {
      lessonType: true,
    },
  });

  const topPracticeTypes = practiceTypes.map((pt) => ({
    type: pt.lessonType,
    count: pt._count.lessonType,
  }));

  return {
    monthName,
    completedSessions,
    totalMinutes,
    longestStreak,
    programsStarted: programsStarted.length,
    achievements: achievementsStr,
    yearlyMinutes,
    monthStart,
    monthEnd: now,
    topPracticeTypes,
  };
}

// ============================================
// Recommendations
// ============================================

async function generateRecommendations(userId: string): Promise<string> {
  // Get user's recent activity
  const recentProgress = await prisma.video_progress.findMany({
    where: {
      userId,
      lastWatchedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { lastWatchedAt: 'desc' },
    take: 10,
    select: {
      lessonId: true,
      lessonType: true,
      percentage: true,
    },
  });

  // Get user's subscription tier
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const recommendations: string[] = [];

  // Check for incomplete content
  const incomplete = recentProgress.filter((p) => p.percentage < 80);
  if (incomplete.length > 0) {
    recommendations.push('Yarım kalan içeriklerini tamamla');
  }

  // Check if user hasn't tried challenges
  const challengeCount = await prisma.challenge_enrollments.count({
    where: { userId },
  });

  if (challengeCount === 0) {
    recommendations.push('İlk challenge\'ına katıl');
  }

  // Suggest premium if free user
  if (user?.subscriptionTier === 'FREE') {
    recommendations.push('Premium özellikleri keşfet');
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push('Yeni programlarımızı dene');
  }

  return recommendations.slice(0, 3).join(' | ');
}

// ============================================
// User Engagement Stats
// ============================================

/**
 * Update user engagement stats
 */
export async function updateEngagementStats(userId: string): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate sessions
  const totalSessions = await prisma.daily_checks.count({
    where: { userId },
  });

  // Calculate practice minutes
  const allProgress = await prisma.video_progress.findMany({
    where: { userId },
    select: { currentTime: true },
  });

  const totalPracticeMinutes = Math.round(
    allProgress.reduce((sum, vp) => sum + vp.currentTime, 0) / 60
  );

  // Calculate current streak
  const currentStreak = await calculateCurrentStreak(userId);

  // Get longest streak
  const existingStats = await prisma.user_engagement_stats.findUnique({
    where: { userId },
  });

  const longestStreak = Math.max(existingStats?.longestStreak || 0, currentStreak);

  // Calculate engagement score (0-100)
  const engagementScore = calculateEngagementScore({
    totalSessions,
    totalPracticeMinutes,
    currentStreak,
    lastActiveAt: now,
  });

  // Upsert engagement stats
  await prisma.user_engagement_stats.upsert({
    where: { userId },
    create: {
      userId,
      lastActiveAt: now,
      lastSessionAt: now,
      totalSessions,
      totalPracticeMinutes,
      currentStreak,
      longestStreak,
      engagementScore,
    },
    update: {
      lastActiveAt: now,
      lastSessionAt: now,
      totalSessions,
      totalPracticeMinutes,
      currentStreak,
      longestStreak,
      engagementScore,
    },
  });

  logger.debug({ userId, engagementScore }, 'User engagement stats updated');
}

/**
 * Calculate current streak
 */
async function calculateCurrentStreak(userId: string): Promise<number> {
  const checks = await prisma.daily_checks.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (checks.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const check of checks) {
    const checkDate = new Date(check.date);
    checkDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - checkDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      currentDate = checkDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(data: {
  totalSessions: number;
  totalPracticeMinutes: number;
  currentStreak: number;
  lastActiveAt: Date;
}): number {
  let score = 0;

  // Sessions score (max 30 points)
  score += Math.min(data.totalSessions * 2, 30);

  // Practice time score (max 30 points)
  score += Math.min(data.totalPracticeMinutes / 10, 30);

  // Streak score (max 20 points)
  score += Math.min(data.currentStreak * 2, 20);

  // Recency score (max 20 points)
  const daysSinceActive = Math.floor(
    (Date.now() - data.lastActiveAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  score += Math.max(20 - daysSinceActive * 2, 0);

  return Math.min(Math.round(score), 100);
}

// ============================================
// Batch Operations
// ============================================

/**
 * Get users eligible for weekly digest
 */
export async function getWeeklyDigestRecipients(): Promise<string[]> {
  const users = await prisma.user_message_preferences.findMany({
    where: {
      weeklyDigest: true,
    },
    select: {
      userId: true,
    },
  });

  return users.map((u) => u.userId);
}

/**
 * Get users eligible for monthly digest
 */
export async function getMonthlyDigestRecipients(): Promise<string[]> {
  const users = await prisma.user_message_preferences.findMany({
    where: {
      monthlyDigest: true,
    },
    select: {
      userId: true,
    },
  });

  return users.map((u) => u.userId);
}

/**
 * Get inactive users
 */
export async function getInactiveUsers(
  daysSinceActive: number,
): Promise<{ userId: string; lastActiveAt: Date | null }[]> {
  const cutoffDate = new Date(Date.now() - daysSinceActive * 24 * 60 * 60 * 1000);

  const users = await prisma.user_engagement_stats.findMany({
    where: {
      OR: [
        { lastActiveAt: { lt: cutoffDate } },
        { lastActiveAt: null },
      ],
    },
    select: {
      userId: true,
      lastActiveAt: true,
    },
  });

  // Filter users who have inactivity reminders enabled
  const result: { userId: string; lastActiveAt: Date | null }[] = [];

  for (const user of users) {
    const preference = await prisma.user_message_preferences.findUnique({
      where: { userId: user.userId },
    });

    if (!preference || preference.inactivityReminders) {
      result.push(user);
    }
  }

  return result;
}

/**
 * Get users with expiring trials
 */
export async function getUsersWithExpiringTrials(
  daysUntilExpiration: number,
): Promise<{ userId: string; trialEnd: Date }[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysUntilExpiration);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      status: 'TRIALING',
      trialEnd: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    select: {
      userId: true,
      trialEnd: true,
    },
  });

  return subscriptions
    .filter((s) => s.trialEnd !== null)
    .map((s) => ({
      userId: s.userId,
      trialEnd: s.trialEnd!,
    }));
}

/**
 * Get users with upcoming subscription renewals
 */
export async function getUsersWithUpcomingRenewals(
  daysUntilRenewal: number,
): Promise<{ userId: string; currentPeriodEnd: Date; planName: string }[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysUntilRenewal);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      status: 'ACTIVE',
      autoRenew: true,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    include: {
      plan: {
        select: { name: true },
      },
    },
  });

  return subscriptions
    .filter((s) => s.currentPeriodEnd !== null)
    .map((s) => ({
      userId: s.userId,
      currentPeriodEnd: s.currentPeriodEnd!,
      planName: s.plan.name,
    }));
}
