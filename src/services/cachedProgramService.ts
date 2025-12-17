import {
  getOrSet,
  buildProgramKey,
  buildProgramListKey,
  buildTagsKey,
} from './cacheService';
import {
  listPrograms,
  getProgramById,
  listTagsByKind,
} from './programService';
import { CACHE_TTL } from '../constants/cacheTTL';
import type { ProgramFilters } from '../validation/programSchemas';

/**
 * Get a single program with caching
 */
export async function getCachedProgram(id: string) {
  return getOrSet(
    buildProgramKey(id),
    () => getProgramById(id),
    CACHE_TTL.PROGRAMS
  );
}

/**
 * Get program list with caching
 */
export async function getCachedProgramList(filters: ProgramFilters = {}) {
  return getOrSet(
    buildProgramListKey(filters as Record<string, unknown>),
    () => listPrograms(filters),
    CACHE_TTL.PROGRAM_LIST
  );
}

/**
 * Get program with sessions (detail view) with caching
 */
export async function getCachedProgramWithSessions(id: string) {
  return getCachedProgram(id);
}

/**
 * Get tags grouped by kind with caching
 */
export async function getCachedTags() {
  return getOrSet(
    buildTagsKey(),
    () => listTagsByKind(),
    CACHE_TTL.TAGS
  );
}

/**
 * Get tags by type with caching
 */
export async function getCachedTagsByType(type: 'LEVEL' | 'FOCUS' | 'EQUIPMENT') {
  const tags = await getCachedTags();
  if (!tags) return [];
  return tags[type] ?? [];
}

export const cachedProgramService = {
  getCachedProgram,
  getCachedProgramList,
  getCachedProgramWithSessions,
  getCachedTags,
  getCachedTagsByType,
};
