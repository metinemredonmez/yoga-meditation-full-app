import { getOrSet, del, delByPattern } from '../services/cacheService';
import { CACHE_TTL } from '../constants/cacheTTL';

/**
 * Wraps a function with caching capability
 *
 * @example
 * const getCachedProgram = withCache(
 *   (id) => `program:${id}`,
 *   CACHE_TTL.PROGRAMS,
 *   (id) => programService.findById(id)
 * );
 *
 * // Usage
 * const program = await getCachedProgram('abc123');
 */
export function withCache<TArgs extends unknown[], TResult>(
  keyBuilder: (...args: TArgs) => string,
  ttl: number,
  fetchFn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyBuilder(...args);
    return getOrSet(key, () => fetchFn(...args), ttl);
  };
}

/**
 * Creates a cached version of a service method with automatic invalidation
 *
 * @example
 * const cachedGetProgram = createCachedMethod({
 *   keyBuilder: (id: string) => `program:${id}`,
 *   ttl: CACHE_TTL.PROGRAMS,
 *   fetchFn: programService.findById,
 * });
 */
export function createCachedMethod<TArgs extends unknown[], TResult>(config: {
  keyBuilder: (...args: TArgs) => string;
  ttl?: number;
  fetchFn: (...args: TArgs) => Promise<TResult>;
}): {
  get: (...args: TArgs) => Promise<TResult>;
  invalidate: (...args: TArgs) => Promise<boolean>;
} {
  const { keyBuilder, ttl = CACHE_TTL.DEFAULT, fetchFn } = config;

  return {
    get: withCache(keyBuilder, ttl, fetchFn),
    invalidate: async (...args: TArgs): Promise<boolean> => {
      const key = keyBuilder(...args);
      return del(key);
    },
  };
}

/**
 * Creates a cached list method with pattern-based invalidation
 *
 * @example
 * const cachedListPrograms = createCachedListMethod({
 *   baseKey: 'program:list',
 *   ttl: CACHE_TTL.PROGRAM_LIST,
 *   fetchFn: programService.list,
 * });
 */
export function createCachedListMethod<TFilters extends Record<string, unknown>, TResult>(config: {
  baseKey: string;
  ttl?: number;
  fetchFn: (filters: TFilters) => Promise<TResult>;
}): {
  get: (filters: TFilters) => Promise<TResult>;
  invalidateAll: () => Promise<number>;
} {
  const { baseKey, ttl = CACHE_TTL.DEFAULT, fetchFn } = config;

  const hashFilters = (filters: TFilters): string => {
    const sorted = Object.keys(filters)
      .sort()
      .reduce(
        (acc, key) => {
          const value = filters[key];
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

    if (Object.keys(sorted).length === 0) {
      return 'e3b0c442'; // MD5 of empty object
    }

    // Simple hash (for more complex needs, use crypto.createHash)
    const str = JSON.stringify(sorted);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  };

  return {
    get: async (filters: TFilters): Promise<TResult> => {
      const key = `${baseKey}:${hashFilters(filters)}`;
      return getOrSet(key, () => fetchFn(filters), ttl);
    },
    invalidateAll: async (): Promise<number> => {
      return delByPattern(`${baseKey}:*`);
    },
  };
}

/**
 * Creates a user-scoped cached method
 *
 * @example
 * const cachedUserProgress = createUserCachedMethod({
 *   keyBuilder: (userId) => `user:${userId}:progress`,
 *   ttl: CACHE_TTL.USER_PROGRESS,
 *   fetchFn: progressService.getByUserId,
 * });
 */
export function createUserCachedMethod<TArgs extends unknown[], TResult>(config: {
  keyBuilder: (userId: string, ...args: TArgs) => string;
  ttl?: number;
  fetchFn: (userId: string, ...args: TArgs) => Promise<TResult>;
}): {
  get: (userId: string, ...args: TArgs) => Promise<TResult>;
  invalidate: (userId: string, ...args: TArgs) => Promise<boolean>;
  invalidateAllForUser: (userId: string) => Promise<number>;
} {
  const { keyBuilder, ttl = CACHE_TTL.DEFAULT, fetchFn } = config;

  return {
    get: async (userId: string, ...args: TArgs): Promise<TResult> => {
      const key = keyBuilder(userId, ...args);
      return getOrSet(key, () => fetchFn(userId, ...args), ttl);
    },
    invalidate: async (userId: string, ...args: TArgs): Promise<boolean> => {
      const key = keyBuilder(userId, ...args);
      return del(key);
    },
    invalidateAllForUser: async (userId: string): Promise<number> => {
      return delByPattern(`user:${userId}:*`);
    },
  };
}

/**
 * Decorator-style function to wrap existing service with caching
 * Returns a proxy that caches specified methods
 *
 * @example
 * const cachedProgramService = wrapServiceWithCache(programService, {
 *   findById: {
 *     keyBuilder: (id) => `program:${id}`,
 *     ttl: CACHE_TTL.PROGRAMS,
 *   },
 *   list: {
 *     keyBuilder: (filters) => `program:list:${hashObject(filters)}`,
 *     ttl: CACHE_TTL.PROGRAM_LIST,
 *   },
 * });
 */
export function wrapServiceWithCache<T extends Record<string, (...args: unknown[]) => Promise<unknown>>>(
  service: T,
  cacheConfig: {
    [K in keyof T]?: {
      keyBuilder: (...args: Parameters<T[K]>) => string;
      ttl?: number;
    };
  }
): T {
  const wrappedService = {} as T;

  for (const methodName of Object.keys(service) as Array<keyof T>) {
    const method = service[methodName];
    const config = cacheConfig[methodName];

    if (config && typeof method === 'function') {
      wrappedService[methodName] = (async (...args: Parameters<T[keyof T]>) => {
        const key = config.keyBuilder(...args);
        return getOrSet(key, () => method.apply(service, args), config.ttl ?? CACHE_TTL.DEFAULT);
      }) as T[keyof T];
    } else {
      wrappedService[methodName] = method;
    }
  }

  return wrappedService;
}

export const cacheDecorator = {
  withCache,
  createCachedMethod,
  createCachedListMethod,
  createUserCachedMethod,
  wrapServiceWithCache,
};
