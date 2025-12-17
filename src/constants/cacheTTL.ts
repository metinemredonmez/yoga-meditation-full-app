/**
 * Cache TTL (Time To Live) Constants
 * Values are in seconds
 */
export const CACHE_TTL = {
  // Static/rarely changing data
  TAGS: 86400, // 24 hours
  POSES: 3600, // 1 hour
  POSE_LIST: 1800, // 30 minutes

  // Semi-static data
  PROGRAMS: 600, // 10 minutes
  PROGRAM_LIST: 300, // 5 minutes
  CHALLENGES: 300, // 5 minutes
  CHALLENGE_LIST: 180, // 3 minutes
  CLASSES: 180, // 3 minutes
  CLASS_LIST: 120, // 2 minutes

  // User-specific data
  USER_PROFILE: 300, // 5 minutes
  USER_PROGRESS: 60, // 1 minute
  USER_FAVORITES: 300, // 5 minutes
  USER_PREFERENCES: 600, // 10 minutes
  USER_SUBSCRIPTIONS: 300, // 5 minutes

  // Real-time data (short TTL)
  STATS: 60, // 1 minute
  DASHBOARD_STATS: 60, // 1 minute
  LEADERBOARD: 30, // 30 seconds
  ACTIVE_CHALLENGE: 60, // 1 minute

  // Session data
  SESSION: 1800, // 30 minutes
  API_KEY_VALIDATION: 300, // 5 minutes

  // Search results
  SEARCH_RESULTS: 120, // 2 minutes

  // Default
  DEFAULT: 300, // 5 minutes
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;

/**
 * Cache key prefixes for organized key management
 */
export const CACHE_PREFIXES = {
  // Entity prefixes
  PROGRAM: 'program',
  POSE: 'pose',
  CHALLENGE: 'challenge',
  CLASS: 'class',
  USER: 'user',
  TAG: 'tag',
  STATS: 'stats',
  SESSION: 'session',
  API_KEY: 'apikey',
  SEARCH: 'search',

  // List prefixes
  LIST: 'list',
  ALL: 'all',

  // User sub-keys
  PROGRESS: 'progress',
  FAVORITES: 'favorites',
  PREFERENCES: 'preferences',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

export type CachePrefixKey = keyof typeof CACHE_PREFIXES;
