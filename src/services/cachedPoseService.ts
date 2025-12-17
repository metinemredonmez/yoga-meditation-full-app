import {
  getOrSet,
  mget,
  buildPoseKey,
  buildPoseListKey,
} from './cacheService';
import { listPoses, getPoseById } from './poseService';
import { CACHE_TTL } from '../constants/cacheTTL';
import type { PoseFilters } from '../validation/poseSchemas';

/**
 * Get a single pose with caching
 */
export async function getCachedPose(id: string) {
  return getOrSet(
    buildPoseKey(id),
    () => getPoseById(id),
    CACHE_TTL.POSES
  );
}

/**
 * Get pose list with caching
 */
export async function getCachedPoseList(filters: PoseFilters = {}) {
  return getOrSet(
    buildPoseListKey(filters as Record<string, unknown>),
    () => listPoses(filters),
    CACHE_TTL.POSE_LIST
  );
}

/**
 * Get multiple poses by IDs with caching
 */
export async function getCachedPosesByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  // Build cache keys
  const keys = ids.map(buildPoseKey);

  // Try to get all from cache
  const cachedResults = await mget<Awaited<ReturnType<typeof getPoseById>>>(keys);

  // Find missing poses
  const results: Array<Awaited<ReturnType<typeof getPoseById>>> = [];
  const missingIds: string[] = [];
  const missingIndices: number[] = [];

  cachedResults.forEach((result, index) => {
    if (result !== null) {
      results[index] = result;
    } else {
      missingIds.push(ids[index] as string);
      missingIndices.push(index);
    }
  });

  // Fetch missing poses from DB
  if (missingIds.length > 0) {
    const fetchedPoses = await Promise.all(
      missingIds.map((id) => getCachedPose(id))
    );

    fetchedPoses.forEach((pose, i) => {
      const originalIndex = missingIndices[i];
      if (originalIndex !== undefined) {
        results[originalIndex] = pose;
      }
    });
  }

  // Filter out nulls and return
  return results.filter((pose) => pose !== null);
}

export const cachedPoseService = {
  getCachedPose,
  getCachedPoseList,
  getCachedPosesByIds,
};
