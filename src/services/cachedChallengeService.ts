import {
  getOrSet,
  get,
  set,
  buildChallengeKey,
  buildChallengeListKey,
  buildStatsKey,
} from './cacheService';
// TODO: Restore when challengeService is created
// import { listChallenges, getChallengeById } from './challengeService';
import { CACHE_TTL } from '../constants/cacheTTL';
import { prisma } from '../utils/database';

/**
 * Get a single challenge with caching
 * Note: User-specific data (enrolled, completedDays) is NOT cached
 */
export async function getCachedChallenge(challengeId: string, userId?: string) {
  // TODO: Restore when challengeService is created
  // If user-specific data is needed, we can't cache as easily
  // So we only cache the base challenge data
  // if (userId) {
  //   return getChallengeById(challengeId, userId);
  // }

  // return getOrSet(
  //   buildChallengeKey(challengeId),
  //   () => getChallengeById(challengeId),
  //   CACHE_TTL.CHALLENGES
  // );
  throw new Error('getCachedChallenge not implemented - challengeService missing');
}

/**
 * Get challenge list with caching
 * Note: User-specific enrollment status is NOT cached
 */
export async function getCachedChallengeList(userId?: string) {
  // TODO: Restore when challengeService is created
  // If user-specific data is needed, we can't use shared cache
  // if (userId) {
  //   return listChallenges(userId);
  // }

  // return getOrSet(
  //   buildChallengeListKey({}),
  //   () => listChallenges(),
  //   CACHE_TTL.CHALLENGE_LIST
  // );
  throw new Error('getCachedChallengeList not implemented - challengeService missing');
}

/**
 * Get the currently active challenge with caching
 */
export async function getCachedActiveChallenge() {
  const cacheKey = buildStatsKey('active-challenge');

  // Try cache first
  const cached = await get<any>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Find active challenge
  const now = new Date();
  const challenge = await prisma.challenges.findFirst({
    where: {
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: { startAt: 'desc' },
    include: {
      _count: { select: { challenge_enrollments: true, daily_checks: true } },
    },
  });

  if (!challenge) {
    // Cache null result for a short time
    await set(cacheKey, null, CACHE_TTL.ACTIVE_CHALLENGE);
    return null;
  }

  const result = {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    startAt: challenge.startAt,
    endAt: challenge.endAt,
    targetDays: challenge.targetDays,
    coverUrl: challenge.coverUrl,
    enrollmentCount: challenge._count.challenge_enrollments,
    totalCompletions: challenge._count.daily_checks,
    enrolled: false,
  };

  await set(cacheKey, result, CACHE_TTL.ACTIVE_CHALLENGE);
  return result;
}

/**
 * Get leaderboard for a challenge with caching
 */
export async function getCachedLeaderboard(challengeId: string, limit: number = 10) {
  const cacheKey = `${buildChallengeKey(challengeId)}:leaderboard:${limit}`;

  return getOrSet(
    cacheKey,
    async () => {
      const results = await prisma.daily_checks.groupBy({
        by: ['userId'],
        where: { challengeId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      // Get user details
      const userIds = results.map((r) => r.userId);
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      return results.map((result, index) => {
        const user = userMap.get(result.userId);
        const userName = user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown'
          : 'Unknown';
        return {
          rank: index + 1,
          userId: result.userId,
          userName,
          completedDays: result._count.id,
        };
      });
    },
    CACHE_TTL.LEADERBOARD
  );
}

export const cachedChallengeService = {
  getCachedChallenge,
  getCachedChallengeList,
  getCachedActiveChallenge,
  getCachedLeaderboard,
};
