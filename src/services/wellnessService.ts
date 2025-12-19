import { prisma } from '../utils/database';
import type { RecordActivityInput } from '../validation/wellnessSchemas';

// ==================== GET WELLNESS STATS ====================

export async function getWellnessStats(userId: string) {
  // Get or create user wellness stats
  let stats = await prisma.user_wellness_stats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.user_wellness_stats.create({
      data: { userId },
    });
  }

  // Check and reset weekly/monthly stats if needed
  const now = new Date();
  const statsNeedUpdate = shouldResetPeriodStats(stats, now);

  if (statsNeedUpdate) {
    stats = await resetPeriodStats(userId, stats, now);
  }

  return stats;
}

// ==================== GET SUMMARY ====================

export async function getWellnessSummary(userId: string) {
  const stats = await getWellnessStats(userId);

  // Calculate daily stats from recent sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayMeditations, todayBreathworks] = await Promise.all([
    prisma.meditation_sessions.count({
      where: {
        userId,
        startedAt: { gte: today },
      },
    }),
    prisma.breathwork_sessions.count({
      where: {
        userId,
        startedAt: { gte: today },
      },
    }),
  ]);

  // Get recent mood trend
  const recentMoods = await prisma.mood_entries.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 7,
    select: { mood: true, energy: true },
  });

  // Calculate mood trend
  const moodValues: Record<string, number> = {
    VERY_BAD: 1,
    BAD: 2,
    NEUTRAL: 3,
    GOOD: 4,
    VERY_GOOD: 5,
  };

  let moodTrend = 'stable';
  if (recentMoods.length >= 3) {
    const recentAvg = recentMoods.slice(0, 3).reduce((acc, m) => acc + (moodValues[m.mood] || 3), 0) / 3;
    const olderAvg = recentMoods.slice(3).reduce((acc, m) => acc + (moodValues[m.mood] || 3), 0) / Math.max(1, recentMoods.length - 3);
    if (recentAvg > olderAvg + 0.5) moodTrend = 'improving';
    else if (recentAvg < olderAvg - 0.5) moodTrend = 'declining';
  }

  return {
    totalStats: {
      totalMeditationMinutes: stats?.totalMeditationMinutes ?? 0,
      totalBreathworkMinutes: stats?.totalBreathworkMinutes ?? 0,
      totalSessionMinutes: stats?.totalSessionMinutes ?? 0,
      totalSessionCount: stats?.totalSessionCount ?? 0,
      totalJournalEntries: stats?.totalJournalEntries ?? 0,
      totalMoodEntries: stats?.totalMoodEntries ?? 0,
    },
    streaks: {
      currentStreak: stats?.currentStreak ?? 0,
      longestStreak: stats?.longestStreak ?? 0,
    },
    weekly: {
      minutes: stats?.weeklyMinutes ?? 0,
      sessionCount: stats?.weeklySessionCount ?? 0,
    },
    monthly: {
      minutes: stats?.monthlyMinutes ?? 0,
      sessionCount: stats?.monthlySessionCount ?? 0,
    },
    today: {
      meditationCount: todayMeditations,
      breathworkCount: todayBreathworks,
      totalCount: todayMeditations + todayBreathworks,
    },
    moodTrend,
    achievements: {
      achievementCount: stats?.achievementCount ?? 0,
      badgeCount: stats?.badgeCount ?? 0,
    },
    topCategories: stats?.topCategories ?? null,
    topTimes: stats?.topTimes ?? null,
    lastActivityDate: stats?.lastActivityDate ?? null,
  };
}

// ==================== GET STREAK INFO ====================

export async function getStreakInfo(userId: string) {
  const stats = await getWellnessStats(userId);

  // Calculate days until streak breaks
  const lastActivity = stats?.lastActivityDate;
  let daysUntilBreak = 0;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      daysUntilBreak = 1; // Already did activity today, streak safe for today
    } else if (diffDays === 1) {
      daysUntilBreak = 1; // Need to do activity today to maintain streak
    } else {
      daysUntilBreak = 0; // Streak already broken
    }
  }

  // Get streak history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [meditationDates, breathworkDates, journalDates] = await Promise.all([
    prisma.meditation_sessions.findMany({
      where: {
        userId,
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true },
    }),
    prisma.breathwork_sessions.findMany({
      where: {
        userId,
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true },
    }),
    prisma.journal_entries.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      select: { date: true },
    }),
  ]);

  // Combine all activity dates
  const activityDates = new Set<string>();
  meditationDates.forEach((m) => activityDates.add(m.startedAt.toISOString().split('T')[0]!));
  breathworkDates.forEach((b) => activityDates.add(b.startedAt.toISOString().split('T')[0]!));
  journalDates.forEach((j) => activityDates.add(j.date.toISOString().split('T')[0]!));

  // Generate calendar for last 30 days
  const calendar: { date: string; hasActivity: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]!;
    calendar.push({
      date: dateStr,
      hasActivity: activityDates.has(dateStr),
    });
  }

  return {
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    daysUntilBreak,
    lastActivityDate: stats?.lastActivityDate ?? null,
    calendar,
  };
}

// ==================== RECORD ACTIVITY ====================

export async function recordActivity(userId: string, input: RecordActivityInput) {
  const { type, durationMinutes = 0 } = input;

  // Get or create stats
  let stats = await prisma.user_wellness_stats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.user_wellness_stats.create({
      data: { userId },
    });
  }

  const now = new Date();

  // Reset period stats if needed
  const needsReset = shouldResetPeriodStats(stats, now);
  if (needsReset) {
    stats = await resetPeriodStats(userId, stats, now);
  }

  // Update stats based on activity type
  const updateData: any = {
    lastActivityDate: now,
    weeklyMinutes: { increment: durationMinutes },
    weeklySessionCount: { increment: 1 },
    monthlyMinutes: { increment: durationMinutes },
    monthlySessionCount: { increment: 1 },
    totalSessionMinutes: { increment: durationMinutes },
    totalSessionCount: { increment: 1 },
  };

  switch (type) {
    case 'MEDITATION':
      updateData.totalMeditationMinutes = { increment: durationMinutes };
      updateData.totalMeditationCount = { increment: 1 };
      break;
    case 'BREATHWORK':
      updateData.totalBreathworkMinutes = { increment: durationMinutes };
      updateData.totalBreathworkCount = { increment: 1 };
      break;
    case 'SLEEP_STORY':
      updateData.totalSleepStoryCount = { increment: 1 };
      break;
    case 'JOURNAL':
      updateData.totalJournalEntries = { increment: 1 };
      // Journal doesn't count as session for weekly/monthly
      delete updateData.weeklyMinutes;
      delete updateData.weeklySessionCount;
      delete updateData.monthlyMinutes;
      delete updateData.monthlySessionCount;
      delete updateData.totalSessionMinutes;
      delete updateData.totalSessionCount;
      break;
    case 'MOOD':
      updateData.totalMoodEntries = { increment: 1 };
      // Mood doesn't count as session
      delete updateData.weeklyMinutes;
      delete updateData.weeklySessionCount;
      delete updateData.monthlyMinutes;
      delete updateData.monthlySessionCount;
      delete updateData.totalSessionMinutes;
      delete updateData.totalSessionCount;
      break;
  }

  // Update streak
  const streakUpdate = await calculateStreakUpdate(userId, stats?.lastActivityDate ?? null);
  updateData.currentStreak = streakUpdate.currentStreak;
  if (streakUpdate.currentStreak > (stats?.longestStreak ?? 0)) {
    updateData.longestStreak = streakUpdate.currentStreak;
  }

  return prisma.user_wellness_stats.update({
    where: { userId },
    data: updateData,
  });
}

// ==================== HELPER FUNCTIONS ====================

function shouldResetPeriodStats(stats: any, now: Date): boolean {
  if (!stats) return true;

  // Check if week needs reset
  if (stats.weekStartDate) {
    const weekStart = new Date(stats.weekStartDate);
    const daysSinceWeekStart = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceWeekStart >= 7) return true;
  } else {
    return true;
  }

  // Check if month needs reset
  if (stats.monthStartDate) {
    const monthStart = new Date(stats.monthStartDate);
    if (now.getMonth() !== monthStart.getMonth() || now.getFullYear() !== monthStart.getFullYear()) {
      return true;
    }
  } else {
    return true;
  }

  return false;
}

async function resetPeriodStats(userId: string, stats: any, now: Date) {
  const updateData: any = {};

  // Reset weekly stats if week changed
  const weekStart = getStartOfWeek(now);
  if (!stats?.weekStartDate || new Date(stats.weekStartDate).getTime() !== weekStart.getTime()) {
    updateData.weeklyMinutes = 0;
    updateData.weeklySessionCount = 0;
    updateData.weekStartDate = weekStart;
  }

  // Reset monthly stats if month changed
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!stats?.monthStartDate || new Date(stats.monthStartDate).getTime() !== monthStart.getTime()) {
    updateData.monthlyMinutes = 0;
    updateData.monthlySessionCount = 0;
    updateData.monthStartDate = monthStart;
  }

  if (Object.keys(updateData).length > 0) {
    return prisma.user_wellness_stats.update({
      where: { userId },
      data: updateData,
    });
  }

  return stats;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function calculateStreakUpdate(userId: string, lastActivityDate: Date | null) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!lastActivityDate) {
    return { currentStreak: 1 };
  }

  const lastDate = new Date(lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get current stats to read currentStreak
  const stats = await prisma.user_wellness_stats.findUnique({
    where: { userId },
    select: { currentStreak: true },
  });

  if (diffDays === 0) {
    // Same day, streak unchanged
    return { currentStreak: stats?.currentStreak || 1 };
  } else if (diffDays === 1) {
    // Consecutive day, increment streak
    return { currentStreak: (stats?.currentStreak || 0) + 1 };
  } else {
    // Streak broken, start new streak
    return { currentStreak: 1 };
  }
}
