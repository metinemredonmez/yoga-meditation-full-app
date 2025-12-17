import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { isRedisConnected } from '../utils/redis';
import { set, buildProgramKey, buildPoseKey, buildTagsKey, buildStatsKey } from './cacheService';
import { CACHE_TTL } from '../constants/cacheTTL';
import { prisma } from '../utils/database';
import { listPrograms, getProgramById, listTagsByKind } from './programService';
import { listPoses, getPoseById } from './poseService';
import { getCachedActiveChallenge } from './cachedChallengeService';
import { getCachedDashboardStats } from './cachedStatsService';

interface WarmingResult {
  success: boolean;
  warmed: string[];
  errors: string[];
  duration: number;
}

/**
 * Warm program cache with popular/recent programs
 */
export async function warmProgramCache(limit: number = 20): Promise<number> {
  if (!config.cache.enabled || !isRedisConnected()) {
    return 0;
  }

  try {
    // Get most recently updated or popular programs
    const programs = await prisma.program.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: { id: true },
    });

    let warmed = 0;
    for (const program of programs) {
      try {
        const fullProgram = await getProgramById(program.id);
        if (fullProgram) {
          await set(buildProgramKey(program.id), fullProgram, CACHE_TTL.PROGRAMS);
          warmed++;
        }
      } catch (error) {
        logger.warn({ error, programId: program.id }, 'Failed to warm program cache');
      }
    }

    // Also warm the default program list
    try {
      const programList = await listPrograms({});
      await set(`program:list:e3b0c442`, programList, CACHE_TTL.PROGRAM_LIST);
      warmed++;
    } catch (error) {
      logger.warn({ error }, 'Failed to warm program list cache');
    }

    logger.info({ warmed, total: limit }, 'Warmed program cache');
    return warmed;
  } catch (error) {
    logger.error({ error }, 'Error warming program cache');
    return 0;
  }
}

/**
 * Warm pose cache (all poses since they don't change often)
 */
export async function warmPoseCache(): Promise<number> {
  if (!config.cache.enabled || !isRedisConnected()) {
    return 0;
  }

  try {
    const poses = await prisma.pose.findMany({
      select: { id: true },
    });

    let warmed = 0;
    for (const pose of poses) {
      try {
        const fullPose = await getPoseById(pose.id);
        if (fullPose) {
          await set(buildPoseKey(pose.id), fullPose, CACHE_TTL.POSES);
          warmed++;
        }
      } catch (error) {
        logger.warn({ error, poseId: pose.id }, 'Failed to warm pose cache');
      }
    }

    // Also warm the default pose list
    try {
      const poseList = await listPoses({});
      await set(`pose:list:e3b0c442`, poseList, CACHE_TTL.POSE_LIST);
      warmed++;
    } catch (error) {
      logger.warn({ error }, 'Failed to warm pose list cache');
    }

    logger.info({ warmed, total: poses.length }, 'Warmed pose cache');
    return warmed;
  } catch (error) {
    logger.error({ error }, 'Error warming pose cache');
    return 0;
  }
}

/**
 * Warm tag cache
 */
export async function warmTagCache(): Promise<boolean> {
  if (!config.cache.enabled || !isRedisConnected()) {
    return false;
  }

  try {
    const tags = await listTagsByKind();
    await set(buildTagsKey(), tags, CACHE_TTL.TAGS);
    logger.info('Warmed tag cache');
    return true;
  } catch (error) {
    logger.error({ error }, 'Error warming tag cache');
    return false;
  }
}

/**
 * Warm active challenge cache
 */
export async function warmActiveChallengeCache(): Promise<boolean> {
  if (!config.cache.enabled || !isRedisConnected()) {
    return false;
  }

  try {
    await getCachedActiveChallenge();
    logger.info('Warmed active challenge cache');
    return true;
  } catch (error) {
    logger.error({ error }, 'Error warming active challenge cache');
    return false;
  }
}

/**
 * Warm dashboard stats cache
 */
export async function warmStatsCache(): Promise<boolean> {
  if (!config.cache.enabled || !isRedisConnected()) {
    return false;
  }

  try {
    await getCachedDashboardStats();
    await set(buildStatsKey('warmed'), { at: new Date().toISOString() }, CACHE_TTL.STATS);
    logger.info('Warmed stats cache');
    return true;
  } catch (error) {
    logger.error({ error }, 'Error warming stats cache');
    return false;
  }
}

/**
 * Warm all caches
 */
export async function warmAll(): Promise<WarmingResult> {
  const startTime = Date.now();
  const warmed: string[] = [];
  const errors: string[] = [];

  if (!config.cache.enabled) {
    return {
      success: false,
      warmed: [],
      errors: ['Caching is disabled'],
      duration: 0,
    };
  }

  if (!isRedisConnected()) {
    return {
      success: false,
      warmed: [],
      errors: ['Redis is not connected'],
      duration: 0,
    };
  }

  logger.info('Starting cache warming...');

  // Warm tags first (fast, needed by other caches)
  try {
    if (await warmTagCache()) {
      warmed.push('tags');
    } else {
      errors.push('tags');
    }
  } catch {
    errors.push('tags');
  }

  // Warm poses (relatively small dataset)
  try {
    const poseCount = await warmPoseCache();
    if (poseCount > 0) {
      warmed.push(`poses (${poseCount})`);
    } else {
      errors.push('poses');
    }
  } catch {
    errors.push('poses');
  }

  // Warm programs
  try {
    const programCount = await warmProgramCache();
    if (programCount > 0) {
      warmed.push(`programs (${programCount})`);
    } else {
      errors.push('programs');
    }
  } catch {
    errors.push('programs');
  }

  // Warm active challenge
  try {
    if (await warmActiveChallengeCache()) {
      warmed.push('active-challenge');
    }
    // Not an error if no active challenge
  } catch {
    // Ignore - might not have active challenge
  }

  // Warm stats
  try {
    if (await warmStatsCache()) {
      warmed.push('stats');
    } else {
      errors.push('stats');
    }
  } catch {
    errors.push('stats');
  }

  const duration = Date.now() - startTime;

  logger.info(
    { warmed, errors, durationMs: duration },
    `Cache warming completed in ${duration}ms`
  );

  return {
    success: errors.length === 0,
    warmed,
    errors,
    duration,
  };
}

/**
 * Schedule periodic cache warming
 */
export function scheduleWarmup(intervalMinutes: number = 30): NodeJS.Timeout {
  logger.info({ intervalMinutes }, 'Scheduling periodic cache warming');

  return setInterval(
    async () => {
      try {
        await warmAll();
      } catch (error) {
        logger.error({ error }, 'Scheduled cache warming failed');
      }
    },
    intervalMinutes * 60 * 1000
  );
}

export const cacheWarmingService = {
  warmProgramCache,
  warmPoseCache,
  warmTagCache,
  warmActiveChallengeCache,
  warmStatsCache,
  warmAll,
  scheduleWarmup,
};
