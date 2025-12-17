import { logger } from '../utils/logger';
import {
  del,
  delByPattern,
  buildProgramKey,
  buildPoseKey,
  buildChallengeKey,
  buildClassKey,
  buildUserKey,
  buildUserProgressKey,
  buildUserFavoritesKey,
  buildUserPreferencesKey,
  buildUserSubscriptionsKey,
  buildTagsKey,
  buildStatsKey,
} from './cacheService';
import { CACHE_PREFIXES } from '../constants/cacheTTL';

/**
 * Invalidate a single program's cache
 */
export async function invalidateProgram(programId: string): Promise<void> {
  try {
    await del(buildProgramKey(programId));
    logger.debug({ programId }, 'Invalidated program cache');
  } catch (error) {
    logger.error({ error, programId }, 'Error invalidating program cache');
  }
}

/**
 * Invalidate all program list caches
 */
export async function invalidateProgramList(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.PROGRAM}:${CACHE_PREFIXES.LIST}:*`);
    logger.debug({ deleted }, 'Invalidated program list cache');
  } catch (error) {
    logger.error({ error }, 'Error invalidating program list cache');
  }
}

/**
 * Invalidate all program caches (individual + lists)
 */
export async function invalidateAllPrograms(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.PROGRAM}:*`);
    logger.debug({ deleted }, 'Invalidated all program caches');
  } catch (error) {
    logger.error({ error }, 'Error invalidating all program caches');
  }
}

/**
 * Invalidate a single pose's cache
 */
export async function invalidatePose(poseId: string): Promise<void> {
  try {
    await del(buildPoseKey(poseId));
    logger.debug({ poseId }, 'Invalidated pose cache');
  } catch (error) {
    logger.error({ error, poseId }, 'Error invalidating pose cache');
  }
}

/**
 * Invalidate all pose list caches
 */
export async function invalidatePoseList(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.POSE}:${CACHE_PREFIXES.LIST}:*`);
    logger.debug({ deleted }, 'Invalidated pose list cache');
  } catch (error) {
    logger.error({ error }, 'Error invalidating pose list cache');
  }
}

/**
 * Invalidate all pose caches (individual + lists)
 */
export async function invalidateAllPoses(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.POSE}:*`);
    logger.debug({ deleted }, 'Invalidated all pose caches');
  } catch (error) {
    logger.error({ error }, 'Error invalidating all pose caches');
  }
}

/**
 * Invalidate a single challenge's cache
 */
export async function invalidateChallenge(challengeId: string): Promise<void> {
  try {
    await del(buildChallengeKey(challengeId));
    logger.debug({ challengeId }, 'Invalidated challenge cache');
  } catch (error) {
    logger.error({ error, challengeId }, 'Error invalidating challenge cache');
  }
}

/**
 * Invalidate all challenge list caches
 */
export async function invalidateChallengeList(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.CHALLENGE}:${CACHE_PREFIXES.LIST}:*`);
    logger.debug({ deleted }, 'Invalidated challenge list cache');
  } catch (error) {
    logger.error({ error }, 'Error invalidating challenge list cache');
  }
}

/**
 * Invalidate all challenge caches (individual + lists)
 */
export async function invalidateAllChallenges(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.CHALLENGE}:*`);
    logger.debug({ deleted }, 'Invalidated all challenge caches');
  } catch (error) {
    logger.error({ error }, 'Error invalidating all challenge caches');
  }
}

/**
 * Invalidate a single class's cache
 */
export async function invalidateClass(classId: string): Promise<void> {
  try {
    await del(buildClassKey(classId));
    logger.debug({ classId }, 'Invalidated class cache');
  } catch (error) {
    logger.error({ error, classId }, 'Error invalidating class cache');
  }
}

/**
 * Invalidate all class list caches
 */
export async function invalidateClassList(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.CLASS}:${CACHE_PREFIXES.LIST}:*`);
    logger.debug({ deleted }, 'Invalidated class list cache');
  } catch (error) {
    logger.error({ error }, 'Error invalidating class list cache');
  }
}

/**
 * Invalidate all class caches (individual + lists)
 */
export async function invalidateAllClasses(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.CLASS}:*`);
    logger.debug({ deleted }, 'Invalidated all class caches');
  } catch (error) {
    logger.error({ error }, 'Error invalidating all class caches');
  }
}

/**
 * Invalidate a user's cache (profile only)
 */
export async function invalidateUser(userId: string): Promise<void> {
  try {
    await del(buildUserKey(userId));
    logger.debug({ userId }, 'Invalidated user cache');
  } catch (error) {
    logger.error({ error, userId }, 'Error invalidating user cache');
  }
}

/**
 * Invalidate a user's progress cache
 */
export async function invalidateUserProgress(userId: string): Promise<void> {
  try {
    await del(buildUserProgressKey(userId));
    logger.debug({ userId }, 'Invalidated user progress cache');
  } catch (error) {
    logger.error({ error, userId }, 'Error invalidating user progress cache');
  }
}

/**
 * Invalidate a user's favorites cache
 */
export async function invalidateUserFavorites(userId: string, type?: string): Promise<void> {
  try {
    if (type) {
      await del(buildUserFavoritesKey(userId, type));
    } else {
      // Invalidate all favorite types for this user
      await delByPattern(`${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.FAVORITES}*`);
    }
    logger.debug({ userId, type }, 'Invalidated user favorites cache');
  } catch (error) {
    logger.error({ error, userId, type }, 'Error invalidating user favorites cache');
  }
}

/**
 * Invalidate a user's preferences cache
 */
export async function invalidateUserPreferences(userId: string): Promise<void> {
  try {
    await del(buildUserPreferencesKey(userId));
    logger.debug({ userId }, 'Invalidated user preferences cache');
  } catch (error) {
    logger.error({ error, userId }, 'Error invalidating user preferences cache');
  }
}

/**
 * Invalidate a user's subscriptions cache
 */
export async function invalidateUserSubscriptions(userId: string): Promise<void> {
  try {
    await del(buildUserSubscriptionsKey(userId));
    logger.debug({ userId }, 'Invalidated user subscriptions cache');
  } catch (error) {
    logger.error({ error, userId }, 'Error invalidating user subscriptions cache');
  }
}

/**
 * Invalidate all of a user's caches
 */
export async function invalidateAllUserData(userId: string): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.USER}:${userId}*`);
    logger.debug({ userId, deleted }, 'Invalidated all user data caches');
  } catch (error) {
    logger.error({ error, userId }, 'Error invalidating all user data caches');
  }
}

/**
 * Invalidate tags cache
 */
export async function invalidateTags(type?: string): Promise<void> {
  try {
    if (type) {
      await del(buildTagsKey(type));
    } else {
      await delByPattern(`${CACHE_PREFIXES.TAG}:*`);
    }
    logger.debug({ type }, 'Invalidated tags cache');
  } catch (error) {
    logger.error({ error, type }, 'Error invalidating tags cache');
  }
}

/**
 * Invalidate stats cache
 */
export async function invalidateStats(type?: string): Promise<void> {
  try {
    if (type) {
      await del(buildStatsKey(type));
    } else {
      await delByPattern(`${CACHE_PREFIXES.STATS}:*`);
    }
    logger.debug({ type }, 'Invalidated stats cache');
  } catch (error) {
    logger.error({ error, type }, 'Error invalidating stats cache');
  }
}

/**
 * Invalidate search results cache
 */
export async function invalidateSearchResults(): Promise<void> {
  try {
    const deleted = await delByPattern(`${CACHE_PREFIXES.SEARCH}:*`);
    logger.debug({ deleted }, 'Invalidated search results cache');
  } catch (error) {
    logger.error({ error }, 'Error invalidating search results cache');
  }
}

/**
 * Invalidate all caches (use with extreme caution!)
 */
export async function invalidateAll(): Promise<void> {
  try {
    // Delete by known prefixes instead of flushing entire Redis
    const prefixes = Object.values(CACHE_PREFIXES);
    let totalDeleted = 0;

    for (const prefix of prefixes) {
      const deleted = await delByPattern(`${prefix}:*`);
      totalDeleted += deleted;
    }

    logger.warn({ totalDeleted }, 'Invalidated ALL caches');
  } catch (error) {
    logger.error({ error }, 'Error invalidating all caches');
  }
}

// Export as service object for convenience
export const cacheInvalidationService = {
  invalidateProgram,
  invalidateProgramList,
  invalidateAllPrograms,
  invalidatePose,
  invalidatePoseList,
  invalidateAllPoses,
  invalidateChallenge,
  invalidateChallengeList,
  invalidateAllChallenges,
  invalidateClass,
  invalidateClassList,
  invalidateAllClasses,
  invalidateUser,
  invalidateUserProgress,
  invalidateUserFavorites,
  invalidateUserPreferences,
  invalidateUserSubscriptions,
  invalidateAllUserData,
  invalidateTags,
  invalidateStats,
  invalidateSearchResults,
  invalidateAll,
};
