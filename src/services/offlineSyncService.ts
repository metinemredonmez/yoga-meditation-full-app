import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { getRedisClient } from '../utils/redis';

// ============================================
// Types
// ============================================

interface OfflineAction {
  id: string;
  type: 'progress' | 'favorite' | 'bookmark' | 'rating' | 'note';
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  clientId: string; // Unique client-side ID to prevent duplicates
}

interface SyncRequest {
  lastSyncAt: Date | null;
  offlineActions: OfflineAction[];
  deviceId: string;
}

interface SyncResponse {
  success: boolean;
  syncedAt: Date;
  processedActions: {
    id: string;
    success: boolean;
    error?: string;
  }[];
  serverChanges: {
    progress: unknown[];
    favorites: unknown[];
    bookmarks: unknown[];
    settings: unknown;
  };
  conflicts: {
    actionId: string;
    clientData: unknown;
    serverData: unknown;
    resolution: 'client_wins' | 'server_wins' | 'merged';
  }[];
}

interface CacheableContent {
  id: string;
  type: string;
  data: unknown;
  cachedAt: Date;
  expiresAt: Date;
}

// ============================================
// Offline Sync Service
// ============================================

export async function processOfflineSync(
  userId: string,
  request: SyncRequest
): Promise<SyncResponse> {
  const syncedAt = new Date();
  const processedActions: SyncResponse['processedActions'] = [];
  const conflicts: SyncResponse['conflicts'] = [];

  // Process each offline action
  for (const action of request.offlineActions) {
    try {
      // Check for duplicate processing
      const isDuplicate = await checkDuplicateAction(userId, action.clientId);
      if (isDuplicate) {
        processedActions.push({
          id: action.id,
          success: true,
          error: 'Already processed'
        });
        continue;
      }

      // Check for conflicts
      const conflict = await detectConflict(userId, action);
      if (conflict) {
        const resolution = await resolveConflict(userId, action, conflict);
        conflicts.push({
          actionId: action.id,
          clientData: action.data,
          serverData: conflict.serverData,
          resolution: resolution.strategy
        });

        if (resolution.strategy === 'server_wins') {
          processedActions.push({ id: action.id, success: true });
          continue;
        }
      }

      // Process the action
      await processAction(userId, action);
      await markActionProcessed(userId, action.clientId);

      processedActions.push({ id: action.id, success: true });
    } catch (error) {
      logger.error({ err: error, actionId: action.id }, 'Failed to process offline action');
      processedActions.push({
        id: action.id,
        success: false,
        error: (error as Error).message
      });
    }
  }

  // Get server changes since last sync
  const serverChanges = await getServerChangesSince(userId, request.lastSyncAt);

  // Update last sync timestamp
  await updateLastSyncTimestamp(userId, request.deviceId, syncedAt);

  return {
    success: true,
    syncedAt,
    processedActions,
    serverChanges,
    conflicts
  };
}

async function checkDuplicateAction(userId: string, clientId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    const key = `sync:processed:${userId}:${clientId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  // Fallback to database check
  const existing = await prisma.syncLog.findFirst({
    where: { userId, clientActionId: clientId }
  });
  return !!existing;
}

async function markActionProcessed(userId: string, clientId: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    const key = `sync:processed:${userId}:${clientId}`;
    await redis.setex(key, 86400 * 7, '1'); // Keep for 7 days
  }

  await prisma.syncLog.create({
    data: {
      userId,
      clientActionId: clientId,
      processedAt: new Date()
    }
  });
}

interface ConflictData {
  serverData: unknown;
  serverTimestamp: Date;
}

async function detectConflict(
  userId: string,
  action: OfflineAction
): Promise<ConflictData | null> {
  // Get server version of the entity
  let serverEntity: { updatedAt: Date } | null = null;

  switch (action.entityType) {
    case 'videoProgress':
      serverEntity = await prisma.videoProgress.findFirst({
        where: { userId, classId: action.entityId },
        select: { updatedAt: true, watchedSeconds: true, isCompleted: true }
      }) as { updatedAt: Date } | null;
      break;
    case 'favorite':
      serverEntity = await prisma.favorite.findFirst({
        where: { userId, entityId: action.entityId },
        select: { createdAt: true }
      }) as unknown as { updatedAt: Date } | null;
      break;
    case 'bookmark':
      serverEntity = await prisma.bookmark.findFirst({
        where: { userId, entityId: action.entityId },
        select: { updatedAt: true }
      }) as { updatedAt: Date } | null;
      break;
  }

  if (!serverEntity) return null;

  // Check if server version is newer than client action
  const serverTimestamp = serverEntity.updatedAt || new Date(0);
  if (serverTimestamp > action.timestamp) {
    return {
      serverData: serverEntity,
      serverTimestamp
    };
  }

  return null;
}

interface ResolutionResult {
  strategy: 'client_wins' | 'server_wins' | 'merged';
}

async function resolveConflict(
  userId: string,
  action: OfflineAction,
  conflict: ConflictData
): Promise<ResolutionResult> {
  // Default strategy: Last Write Wins
  // For progress data, we might want to merge (take maximum values)

  if (action.entityType === 'videoProgress') {
    // For video progress, merge by taking maximum watched time
    return { strategy: 'merged' };
  }

  // For other types, client wins if action is more recent
  if (action.timestamp > conflict.serverTimestamp) {
    return { strategy: 'client_wins' };
  }

  return { strategy: 'server_wins' };
}

async function processAction(userId: string, action: OfflineAction): Promise<void> {
  switch (action.type) {
    case 'progress':
      await processProgressAction(userId, action);
      break;
    case 'favorite':
      await processFavoriteAction(userId, action);
      break;
    case 'bookmark':
      await processBookmarkAction(userId, action);
      break;
    case 'rating':
      await processRatingAction(userId, action);
      break;
    case 'note':
      await processNoteAction(userId, action);
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function processProgressAction(userId: string, action: OfflineAction): Promise<void> {
  const data = action.data as {
    watchedSeconds?: number;
    totalSeconds?: number;
    isCompleted?: boolean;
    lastPosition?: number;
  };

  if (action.action === 'create' || action.action === 'update') {
    await prisma.videoProgress.upsert({
      where: {
        userId_classId: { userId, classId: action.entityId }
      },
      create: {
        userId,
        classId: action.entityId,
        watchedSeconds: data.watchedSeconds || 0,
        totalSeconds: data.totalSeconds || 0,
        isCompleted: data.isCompleted || false,
        lastPosition: data.lastPosition || 0
      },
      update: {
        watchedSeconds: data.watchedSeconds,
        totalSeconds: data.totalSeconds,
        isCompleted: data.isCompleted,
        lastPosition: data.lastPosition,
        updatedAt: new Date()
      }
    });
  }
}

async function processFavoriteAction(userId: string, action: OfflineAction): Promise<void> {
  const data = action.data as { entityType?: string };

  if (action.action === 'create') {
    await prisma.favorite.upsert({
      where: {
        userId_entityId_entityType: {
          userId,
          entityId: action.entityId,
          entityType: data.entityType || 'class'
        }
      },
      create: {
        userId,
        entityId: action.entityId,
        entityType: data.entityType || 'class'
      },
      update: {}
    });
  } else if (action.action === 'delete') {
    await prisma.favorite.deleteMany({
      where: {
        userId,
        entityId: action.entityId
      }
    });
  }
}

async function processBookmarkAction(userId: string, action: OfflineAction): Promise<void> {
  const data = action.data as {
    entityType?: string;
    note?: string;
    timestamp?: number;
  };

  if (action.action === 'create') {
    await prisma.bookmark.create({
      data: {
        userId,
        entityId: action.entityId,
        entityType: data.entityType || 'class',
        note: data.note,
        timestamp: data.timestamp
      }
    });
  } else if (action.action === 'delete') {
    await prisma.bookmark.deleteMany({
      where: {
        userId,
        entityId: action.entityId
      }
    });
  }
}

async function processRatingAction(userId: string, action: OfflineAction): Promise<void> {
  const data = action.data as {
    rating: number;
    review?: string;
    entityType?: string;
  };

  if (action.action === 'create' || action.action === 'update') {
    await prisma.rating.upsert({
      where: {
        userId_entityId_entityType: {
          userId,
          entityId: action.entityId,
          entityType: data.entityType || 'class'
        }
      },
      create: {
        userId,
        entityId: action.entityId,
        entityType: data.entityType || 'class',
        rating: data.rating,
        review: data.review
      },
      update: {
        rating: data.rating,
        review: data.review,
        updatedAt: new Date()
      }
    });
  }
}

async function processNoteAction(userId: string, action: OfflineAction): Promise<void> {
  const data = action.data as {
    content: string;
    timestamp?: number;
  };

  if (action.action === 'create') {
    await prisma.userNote.create({
      data: {
        userId,
        entityId: action.entityId,
        entityType: 'class',
        content: data.content,
        timestamp: data.timestamp
      }
    });
  } else if (action.action === 'update') {
    await prisma.userNote.updateMany({
      where: { userId, entityId: action.entityId },
      data: { content: data.content, updatedAt: new Date() }
    });
  } else if (action.action === 'delete') {
    await prisma.userNote.deleteMany({
      where: { userId, entityId: action.entityId }
    });
  }
}

async function getServerChangesSince(
  userId: string,
  lastSyncAt: Date | null
): Promise<SyncResponse['serverChanges']> {
  const since = lastSyncAt || new Date(0);

  const [progress, favorites, bookmarks, user] = await Promise.all([
    // Video progress changes
    prisma.videoProgress.findMany({
      where: {
        userId,
        updatedAt: { gt: since }
      },
      select: {
        classId: true,
        watchedSeconds: true,
        totalSeconds: true,
        isCompleted: true,
        lastPosition: true,
        updatedAt: true
      }
    }),

    // Favorites changes
    prisma.favorite.findMany({
      where: {
        userId,
        createdAt: { gt: since }
      },
      select: {
        entityId: true,
        entityType: true,
        createdAt: true
      }
    }),

    // Bookmarks changes
    prisma.bookmark.findMany({
      where: {
        userId,
        updatedAt: { gt: since }
      },
      select: {
        entityId: true,
        entityType: true,
        note: true,
        timestamp: true,
        updatedAt: true
      }
    }),

    // User settings
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPreferences: true,
        language: true,
        timezone: true,
        updatedAt: true
      }
    })
  ]);

  return {
    progress,
    favorites,
    bookmarks,
    settings: user?.updatedAt && user.updatedAt > since ? user : null
  };
}

async function updateLastSyncTimestamp(
  userId: string,
  deviceId: string,
  syncedAt: Date
): Promise<void> {
  await prisma.userDevice.updateMany({
    where: { userId, deviceId },
    data: { lastSyncAt: syncedAt }
  });
}

// ============================================
// Offline Content Caching
// ============================================

export async function getOfflineContent(
  userId: string,
  contentIds: string[]
): Promise<CacheableContent[]> {
  const contents: CacheableContent[] = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Fetch classes for offline viewing
  const classes = await prisma.class.findMany({
    where: {
      id: { in: contentIds },
      isPublished: true
    },
    include: {
      instructor: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true }
      },
      poses: {
        select: {
          pose: {
            select: { id: true, englishName: true, sanskritName: true, imageUrl: true }
          }
        }
      }
    }
  });

  for (const classItem of classes) {
    contents.push({
      id: classItem.id,
      type: 'class',
      data: {
        ...classItem,
        offlineAvailable: true
      },
      cachedAt: now,
      expiresAt
    });
  }

  return contents;
}

export async function markContentForOffline(
  userId: string,
  contentId: string,
  contentType: string
): Promise<{ success: boolean; downloadUrl?: string }> {
  try {
    // Create offline content record
    await prisma.offlineContent.upsert({
      where: {
        userId_contentId_contentType: {
          userId,
          contentId,
          contentType
        }
      },
      create: {
        userId,
        contentId,
        contentType,
        status: 'pending'
      },
      update: {
        status: 'pending',
        updatedAt: new Date()
      }
    });

    // Get download URL for the content
    let downloadUrl: string | undefined;

    if (contentType === 'class') {
      const classItem = await prisma.class.findUnique({
        where: { id: contentId },
        select: { videoUrl: true }
      });
      downloadUrl = classItem?.videoUrl || undefined;
    }

    return { success: true, downloadUrl };
  } catch (error) {
    logger.error({ err: error, userId, contentId }, 'Failed to mark content for offline');
    return { success: false };
  }
}

export async function removeOfflineContent(
  userId: string,
  contentId: string
): Promise<boolean> {
  try {
    await prisma.offlineContent.deleteMany({
      where: { userId, contentId }
    });
    return true;
  } catch (error) {
    logger.error({ err: error, userId, contentId }, 'Failed to remove offline content');
    return false;
  }
}

export async function getOfflineContentList(userId: string): Promise<{
  id: string;
  type: string;
  title: string;
  thumbnailUrl: string | null;
  downloadedAt: Date;
  size?: number;
}[]> {
  const offlineContents = await prisma.offlineContent.findMany({
    where: { userId, status: 'completed' },
    select: {
      contentId: true,
      contentType: true,
      createdAt: true,
      fileSize: true
    }
  });

  const results = [];

  for (const content of offlineContents) {
    let details: { title: string; thumbnailUrl: string | null } | null = null;

    if (content.contentType === 'class') {
      const classItem = await prisma.class.findUnique({
        where: { id: content.contentId },
        select: { title: true, thumbnailUrl: true }
      });
      details = classItem;
    } else if (content.contentType === 'program') {
      const program = await prisma.program.findUnique({
        where: { id: content.contentId },
        select: { title: true, thumbnailUrl: true }
      });
      details = program;
    }

    if (details) {
      results.push({
        id: content.contentId,
        type: content.contentType,
        title: details.title,
        thumbnailUrl: details.thumbnailUrl,
        downloadedAt: content.createdAt,
        size: content.fileSize
      });
    }
  }

  return results;
}

// ============================================
// Delta Sync for Efficient Updates
// ============================================

export async function getDeltaUpdate(
  userId: string,
  lastSyncVersion: number
): Promise<{
  currentVersion: number;
  hasUpdates: boolean;
  updates: {
    type: string;
    action: 'add' | 'update' | 'delete';
    data: unknown;
  }[];
}> {
  // Get current sync version
  const currentVersion = await getCurrentSyncVersion();

  if (lastSyncVersion >= currentVersion) {
    return {
      currentVersion,
      hasUpdates: false,
      updates: []
    };
  }

  // Get changes since last version
  const changes = await prisma.syncChange.findMany({
    where: {
      version: { gt: lastSyncVersion },
      OR: [
        { userId: null }, // Global changes
        { userId } // User-specific changes
      ]
    },
    orderBy: { version: 'asc' }
  });

  const updates = changes.map(change => ({
    type: change.entityType,
    action: change.action as 'add' | 'update' | 'delete',
    data: change.data
  }));

  return {
    currentVersion,
    hasUpdates: updates.length > 0,
    updates
  };
}

async function getCurrentSyncVersion(): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    const version = await redis.get('sync:version');
    return version ? parseInt(version, 10) : 1;
  }

  // Fallback: Get from database
  const latest = await prisma.syncChange.findFirst({
    orderBy: { version: 'desc' },
    select: { version: true }
  });

  return latest?.version || 1;
}

// Export types
export type { OfflineAction, SyncRequest, SyncResponse, CacheableContent };
