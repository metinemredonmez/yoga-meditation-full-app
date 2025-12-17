import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { config } from './config';
import {
  invalidateProgram,
  invalidateProgramList,
  invalidatePose,
  invalidatePoseList,
  invalidateChallenge,
  invalidateChallengeList,
  invalidateUser,
  invalidateUserProgress,
  invalidateUserFavorites,
  invalidateTags,
  invalidateStats,
  invalidateClass,
  invalidateClassList,
} from '../services/cacheInvalidationService';

type PrismaAction =
  | 'create'
  | 'createMany'
  | 'update'
  | 'updateMany'
  | 'delete'
  | 'deleteMany'
  | 'upsert';

const MUTATION_ACTIONS: PrismaAction[] = [
  'create',
  'createMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
];

/**
 * Prisma middleware for automatic cache invalidation
 *
 * Usage in database.ts:
 * ```
 * import { cacheInvalidationMiddleware } from './cacheHooks';
 * prisma.$use(cacheInvalidationMiddleware);
 * ```
 */
export const cacheInvalidationMiddleware: Prisma.Middleware = async (params, next) => {
  // Execute the query first
  const result = await next(params);

  // Skip if caching is disabled
  if (!config.cache.enabled) {
    return result;
  }

  // Skip if not a mutation
  if (!MUTATION_ACTIONS.includes(params.action as PrismaAction)) {
    return result;
  }

  // Invalidate cache based on model
  try {
    await invalidateCacheForModel(params.model, params.action as PrismaAction, result, params.args);
  } catch (error) {
    // Log but don't fail the request
    logger.error(
      { error, model: params.model, action: params.action },
      'Cache invalidation error'
    );
  }

  return result;
};

async function invalidateCacheForModel(
  model: string | undefined,
  action: PrismaAction,
  result: unknown,
  args: unknown
): Promise<void> {
  if (!model) return;

  const id = extractId(result, args);

  switch (model) {
    case 'Program':
      if (id) await invalidateProgram(id);
      await invalidateProgramList();
      await invalidateStats();
      break;

    case 'ProgramSession':
      // Get program ID from the session
      const programId = extractProgramId(result, args);
      if (programId) {
        await invalidateProgram(programId);
        await invalidateProgramList();
      }
      break;

    case 'Pose':
      if (id) await invalidatePose(id);
      await invalidatePoseList();
      await invalidateStats();
      break;

    case 'Challenge':
      if (id) await invalidateChallenge(id);
      await invalidateChallengeList();
      await invalidateStats('active-challenge');
      break;

    case 'ChallengeEnrollment':
      const challengeId = extractChallengeId(result, args);
      if (challengeId) await invalidateChallenge(challengeId);
      await invalidateChallengeList();
      break;

    case 'DailyCheck':
      const checkChallengeId = extractChallengeId(result, args);
      if (checkChallengeId) {
        await invalidateChallenge(checkChallengeId);
        // Invalidate leaderboard
        const { delByPattern } = await import('../services/cacheService');
        await delByPattern(`challenge:${checkChallengeId}:leaderboard*`);
      }
      const checkUserId = extractUserId(result, args);
      if (checkUserId) await invalidateUserProgress(checkUserId);
      break;

    case 'Class':
      if (id) await invalidateClass(id);
      await invalidateClassList();
      break;

    case 'User':
      if (id) await invalidateUser(id);
      await invalidateStats();
      break;

    case 'SessionProgress':
    case 'VideoProgress':
      const progressUserId = extractUserId(result, args);
      if (progressUserId) await invalidateUserProgress(progressUserId);
      break;

    case 'Favorite':
      const favoriteUserId = extractUserId(result, args);
      const favoriteType = extractFavoriteType(result, args);
      if (favoriteUserId) await invalidateUserFavorites(favoriteUserId, favoriteType);
      break;

    case 'Tag':
      await invalidateTags();
      // Tags affect programs and poses
      await invalidateProgramList();
      await invalidatePoseList();
      break;

    case 'Subscription':
    case 'UserSubscription':
      const subUserId = extractUserId(result, args);
      if (subUserId) {
        const { invalidateUserSubscriptions } = await import('../services/cacheInvalidationService');
        await invalidateUserSubscriptions(subUserId);
      }
      break;

    case 'NotificationPreference':
      const prefUserId = extractUserId(result, args);
      if (prefUserId) {
        const { invalidateUserPreferences } = await import('../services/cacheInvalidationService');
        await invalidateUserPreferences(prefUserId);
      }
      break;

    default:
      // Unknown model, don't invalidate anything specific
      if (config.cache.debug) {
        logger.debug({ model, action }, 'No cache invalidation rule for model');
      }
  }
}

function extractId(result: unknown, _args: unknown): string | undefined {
  if (result && typeof result === 'object' && 'id' in result) {
    return (result as { id: string }).id;
  }
  return undefined;
}

function extractProgramId(result: unknown, args: unknown): string | undefined {
  // Try to get from result
  if (result && typeof result === 'object' && 'programId' in result) {
    return (result as { programId: string }).programId;
  }
  // Try to get from args
  if (args && typeof args === 'object' && 'data' in args) {
    const data = (args as { data: unknown }).data;
    if (data && typeof data === 'object' && 'programId' in data) {
      return (data as { programId: string }).programId;
    }
  }
  return undefined;
}

function extractChallengeId(result: unknown, args: unknown): string | undefined {
  if (result && typeof result === 'object' && 'challengeId' in result) {
    return (result as { challengeId: string }).challengeId;
  }
  if (args && typeof args === 'object' && 'data' in args) {
    const data = (args as { data: unknown }).data;
    if (data && typeof data === 'object' && 'challengeId' in data) {
      return (data as { challengeId: string }).challengeId;
    }
  }
  return undefined;
}

function extractUserId(result: unknown, args: unknown): string | undefined {
  if (result && typeof result === 'object' && 'userId' in result) {
    return (result as { userId: string }).userId;
  }
  if (args && typeof args === 'object' && 'data' in args) {
    const data = (args as { data: unknown }).data;
    if (data && typeof data === 'object' && 'userId' in data) {
      return (data as { userId: string }).userId;
    }
  }
  if (args && typeof args === 'object' && 'where' in args) {
    const where = (args as { where: unknown }).where;
    if (where && typeof where === 'object' && 'userId' in where) {
      return (where as { userId: string }).userId;
    }
  }
  return undefined;
}

function extractFavoriteType(result: unknown, args: unknown): string | undefined {
  if (result && typeof result === 'object' && 'type' in result) {
    return (result as { type: string }).type;
  }
  if (args && typeof args === 'object' && 'data' in args) {
    const data = (args as { data: unknown }).data;
    if (data && typeof data === 'object' && 'type' in data) {
      return (data as { type: string }).type;
    }
  }
  return undefined;
}

export const cacheHooks = {
  cacheInvalidationMiddleware,
};
