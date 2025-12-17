import {
  getOrSet,
  buildStatsKey,
  buildUserProgressKey,
} from './cacheService';
import { CACHE_TTL } from '../constants/cacheTTL';
import { prisma } from '../utils/database';

interface DashboardStats {
  totalUsers: number;
  totalPrograms: number;
  totalPoses: number;
  activeChallenges: number;
  totalCompletedVideos: number;
  averageVideosPerUser: number;
}

interface UserStats {
  completedVideos: number;
  totalMinutesYoga: number;
  currentStreak: number;
  longestStreak: number;
  favoritePrograms: number;
  challengesCompleted: number;
}

/**
 * Get dashboard statistics with caching
 */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  return getOrSet(
    buildStatsKey('dashboard'),
    async () => {
      const now = new Date();

      const [
        totalUsers,
        totalPrograms,
        totalPoses,
        activeChallenges,
        totalCompletedVideos,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.program.count(),
        prisma.pose.count(),
        prisma.challenge.count({
          where: {
            startAt: { lte: now },
            endAt: { gte: now },
          },
        }),
        prisma.videoProgress.count({
          where: { completed: true },
        }),
      ]);

      const averageVideosPerUser =
        totalUsers > 0 ? Math.round((totalCompletedVideos / totalUsers) * 100) / 100 : 0;

      return {
        totalUsers,
        totalPrograms,
        totalPoses,
        activeChallenges,
        totalCompletedVideos,
        averageVideosPerUser,
      };
    },
    CACHE_TTL.DASHBOARD_STATS
  );
}

/**
 * Get user-specific statistics with caching
 */
export async function getCachedUserStats(userId: string): Promise<UserStats> {
  return getOrSet(
    buildUserProgressKey(userId),
    async () => {
      const [
        completedVideos,
        progressWithDuration,
        favoritePrograms,
        challengeEnrollments,
      ] = await Promise.all([
        prisma.videoProgress.count({
          where: { userId, completed: true },
        }),
        prisma.videoProgress.findMany({
          where: { userId, completed: true },
          select: {
            duration: true,
          },
        }),
        prisma.favorite.count({
          where: { userId, itemType: 'PROGRAM' },
        }),
        prisma.challengeEnrollment.findMany({
          where: { userId },
          select: {
            challengeId: true,
            challenge: {
              select: { targetDays: true },
            },
          },
        }),
      ]);

      // Calculate total minutes (duration is in seconds)
      const totalMinutesYoga = Math.round(
        progressWithDuration.reduce(
          (sum: number, p: { duration: number }) => sum + (p.duration ?? 0),
          0
        ) / 60
      );

      // Calculate streak (simplified - counts consecutive days with activity)
      const recentActivity = await prisma.videoProgress.findMany({
        where: { userId, completed: true },
        orderBy: { lastWatchedAt: 'desc' },
        take: 365,
        select: { lastWatchedAt: true },
      });

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      if (recentActivity.length > 0) {
        const activityDays = new Set<string>();
        recentActivity.forEach((a) => {
          if (a.lastWatchedAt) {
            activityDays.add(a.lastWatchedAt.toISOString().split('T')[0] as string);
          }
        });

        const sortedDays = Array.from(activityDays).sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        // Check if streak includes today or yesterday
        if (sortedDays[0] === today || isYesterday(sortedDays[0])) {
          for (let i = 0; i < sortedDays.length; i++) {
            const day = sortedDays[i];
            const prevDay = sortedDays[i + 1];

            if (i === 0) {
              tempStreak = 1;
            } else if (prevDay && isConsecutiveDay(prevDay, day)) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          }
          currentStreak = tempStreak;
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }

      // Count completed challenges
      let challengesCompleted = 0;
      for (const enrollment of challengeEnrollments) {
        const checksCount = await prisma.dailyCheck.count({
          where: {
            userId,
            challengeId: enrollment.challengeId,
          },
        });

        if (checksCount >= enrollment.challenge.targetDays) {
          challengesCompleted++;
        }
      }

      return {
        completedVideos,
        totalMinutesYoga,
        currentStreak,
        longestStreak,
        favoritePrograms,
        challengesCompleted,
      };
    },
    CACHE_TTL.USER_PROGRESS
  );
}

function isYesterday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

function isConsecutiveDay(prevDay: string | undefined, currentDay: string | undefined): boolean {
  if (!prevDay || !currentDay) return false;
  const prev = new Date(prevDay);
  const curr = new Date(currentDay);
  prev.setDate(prev.getDate() + 1);
  return prev.toISOString().split('T')[0] === currentDay;
}

/**
 * Get content stats for admin dashboard
 */
export async function getCachedContentStats() {
  return getOrSet(
    buildStatsKey('content'),
    async () => {
      const [
        programsByLevel,
        posesByDifficulty,
        sessionsByProgram,
      ] = await Promise.all([
        prisma.program.groupBy({
          by: ['level'],
          _count: { id: true },
        }),
        prisma.pose.groupBy({
          by: ['difficulty'],
          _count: { id: true },
        }),
        prisma.programSession.groupBy({
          by: ['programId'],
          _count: { id: true },
        }),
      ]);

      return {
        programsByLevel: programsByLevel.map((p) => ({
          level: p.level,
          count: p._count.id,
        })),
        posesByDifficulty: posesByDifficulty.map((p) => ({
          difficulty: p.difficulty,
          count: p._count.id,
        })),
        averageSessionsPerProgram:
          sessionsByProgram.length > 0
            ? Math.round(
                (sessionsByProgram.reduce((sum, s) => sum + s._count.id, 0) /
                  sessionsByProgram.length) *
                  100
              ) / 100
            : 0,
      };
    },
    CACHE_TTL.STATS
  );
}

export const cachedStatsService = {
  getCachedDashboardStats,
  getCachedUserStats,
  getCachedContentStats,
};
