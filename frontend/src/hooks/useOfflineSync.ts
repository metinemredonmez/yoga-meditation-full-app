import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import api from '@/lib/api';

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
  clientId: string;
}

interface VideoProgress {
  classId: string;
  watchedSeconds: number;
  totalSeconds: number;
  isCompleted: boolean;
  lastPosition: number;
  updatedAt: Date;
}

interface OfflineContent {
  id: string;
  type: string;
  data: unknown;
  downloadedAt: Date;
  size?: number;
}

interface YogaDBSchema extends DBSchema {
  actions: {
    key: string;
    value: OfflineAction;
    indexes: { 'by-timestamp': Date };
  };
  progress: {
    key: string;
    value: VideoProgress;
    indexes: { 'by-updated': Date };
  };
  content: {
    key: string;
    value: OfflineContent;
    indexes: { 'by-type': string };
  };
  config: {
    key: string;
    value: { key: string; value: unknown };
  };
}

interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingActions: number;
  error: string | null;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  syncStatus: SyncStatus;
  saveProgress: (classId: string, data: Omit<VideoProgress, 'classId' | 'updatedAt'>) => Promise<void>;
  getProgress: (classId: string) => Promise<VideoProgress | null>;
  addFavorite: (entityId: string, entityType: string) => Promise<void>;
  removeFavorite: (entityId: string) => Promise<void>;
  addBookmark: (entityId: string, data: { entityType: string; note?: string; timestamp?: number }) => Promise<void>;
  removeBookmark: (entityId: string) => Promise<void>;
  saveRating: (entityId: string, data: { rating: number; review?: string; entityType?: string }) => Promise<void>;
  downloadContent: (contentId: string, contentType: string, data: unknown) => Promise<void>;
  getDownloadedContent: (contentId: string) => Promise<OfflineContent | null>;
  getDownloadedContentList: () => Promise<OfflineContent[]>;
  removeDownloadedContent: (contentId: string) => Promise<void>;
  syncNow: () => Promise<void>;
  clearAllOfflineData: () => Promise<void>;
}

// ============================================
// Database Setup
// ============================================

const DB_NAME = 'yoga-offline-db';
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase<YogaDBSchema>> {
  return openDB<YogaDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Actions store
      if (!db.objectStoreNames.contains('actions')) {
        const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
        actionsStore.createIndex('by-timestamp', 'timestamp');
      }

      // Progress store
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'classId' });
        progressStore.createIndex('by-updated', 'updatedAt');
      }

      // Content store
      if (!db.objectStoreNames.contains('content')) {
        const contentStore = db.createObjectStore('content', { keyPath: 'id' });
        contentStore.createIndex('by-type', 'type');
      }

      // Config store
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    }
  });
}

// ============================================
// Hook
// ============================================

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingActions: 0,
    error: null
  });

  const dbRef = useRef<IDBPDatabase<YogaDBSchema> | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize database and online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming online
      syncNow();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize DB
    getDB().then(db => {
      dbRef.current = db;
      updatePendingCount();
      loadLastSyncTime();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Update pending actions count
  const updatePendingCount = useCallback(async () => {
    if (!dbRef.current) return;

    const count = await dbRef.current.count('actions');
    setSyncStatus(s => ({ ...s, pendingActions: count }));
  }, []);

  // Load last sync time from config
  const loadLastSyncTime = useCallback(async () => {
    if (!dbRef.current) return;

    const config = await dbRef.current.get('config', 'lastSyncAt');
    if (config?.value) {
      setSyncStatus(s => ({ ...s, lastSyncAt: new Date(config.value as string) }));
    }
  }, []);

  // Generate unique client ID for actions
  const generateClientId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add action to queue
  const queueAction = useCallback(async (
    type: OfflineAction['type'],
    action: OfflineAction['action'],
    entityType: string,
    entityId: string,
    data: Record<string, unknown>
  ) => {
    if (!dbRef.current) return;

    const offlineAction: OfflineAction = {
      id: generateClientId(),
      type,
      action,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      clientId: generateClientId()
    };

    await dbRef.current.put('actions', offlineAction);
    await updatePendingCount();

    // Schedule sync if online
    if (isOnline) {
      scheduleSyncDebounced();
    }
  }, [isOnline, updatePendingCount]);

  // Debounced sync
  const scheduleSyncDebounced = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncNow();
    }, 5000); // Wait 5 seconds before syncing
  }, []);

  // ============================================
  // Public Methods
  // ============================================

  const saveProgress = useCallback(async (
    classId: string,
    data: Omit<VideoProgress, 'classId' | 'updatedAt'>
  ) => {
    if (!dbRef.current) return;

    const progress: VideoProgress = {
      classId,
      ...data,
      updatedAt: new Date()
    };

    await dbRef.current.put('progress', progress);

    // Also queue as action for server sync
    await queueAction('progress', 'update', 'videoProgress', classId, data);
  }, [queueAction]);

  const getProgress = useCallback(async (classId: string): Promise<VideoProgress | null> => {
    if (!dbRef.current) return null;
    return await dbRef.current.get('progress', classId) || null;
  }, []);

  const addFavorite = useCallback(async (entityId: string, entityType: string) => {
    await queueAction('favorite', 'create', entityType, entityId, { entityType });
  }, [queueAction]);

  const removeFavorite = useCallback(async (entityId: string) => {
    await queueAction('favorite', 'delete', 'favorite', entityId, {});
  }, [queueAction]);

  const addBookmark = useCallback(async (
    entityId: string,
    data: { entityType: string; note?: string; timestamp?: number }
  ) => {
    await queueAction('bookmark', 'create', data.entityType, entityId, data);
  }, [queueAction]);

  const removeBookmark = useCallback(async (entityId: string) => {
    await queueAction('bookmark', 'delete', 'bookmark', entityId, {});
  }, [queueAction]);

  const saveRating = useCallback(async (
    entityId: string,
    data: { rating: number; review?: string; entityType?: string }
  ) => {
    await queueAction('rating', 'create', data.entityType || 'class', entityId, data);
  }, [queueAction]);

  const downloadContent = useCallback(async (
    contentId: string,
    contentType: string,
    data: unknown
  ) => {
    if (!dbRef.current) return;

    const content: OfflineContent = {
      id: contentId,
      type: contentType,
      data,
      downloadedAt: new Date(),
      size: JSON.stringify(data).length
    };

    await dbRef.current.put('content', content);
  }, []);

  const getDownloadedContent = useCallback(async (contentId: string): Promise<OfflineContent | null> => {
    if (!dbRef.current) return null;
    return await dbRef.current.get('content', contentId) || null;
  }, []);

  const getDownloadedContentList = useCallback(async (): Promise<OfflineContent[]> => {
    if (!dbRef.current) return [];
    return await dbRef.current.getAll('content');
  }, []);

  const removeDownloadedContent = useCallback(async (contentId: string) => {
    if (!dbRef.current) return;
    await dbRef.current.delete('content', contentId);
  }, []);

  const syncNow = useCallback(async () => {
    if (!dbRef.current || !isOnline || syncStatus.isSyncing) return;

    setSyncStatus(s => ({ ...s, isSyncing: true, error: null }));

    try {
      // Get all pending actions
      const actions = await dbRef.current.getAll('actions');

      if (actions.length === 0) {
        setSyncStatus(s => ({
          ...s,
          isSyncing: false,
          lastSyncAt: new Date()
        }));
        return;
      }

      // Get device ID (non-sensitive, can stay in localStorage)
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `web-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('deviceId', deviceId);
      }

      // Sync with server using HttpOnly cookie auth
      const { data: result } = await api.post('/api/offline/sync', {
        lastSyncAt: syncStatus.lastSyncAt,
        offlineActions: actions,
        deviceId
      });

      // Remove successfully synced actions
      const successfulIds = result.processedActions
        .filter((a: { success: boolean }) => a.success)
        .map((a: { id: string }) => a.id);

      const tx = dbRef.current.transaction('actions', 'readwrite');
      for (const id of successfulIds) {
        await tx.store.delete(id);
      }
      await tx.done;

      // Apply server changes
      if (result.serverChanges) {
        // Update local progress with server data
        if (result.serverChanges.progress) {
          const progressTx = dbRef.current.transaction('progress', 'readwrite');
          for (const p of result.serverChanges.progress) {
            await progressTx.store.put({
              classId: p.classId,
              watchedSeconds: p.watchedSeconds,
              totalSeconds: p.totalSeconds,
              isCompleted: p.isCompleted,
              lastPosition: p.lastPosition,
              updatedAt: new Date(p.updatedAt)
            });
          }
          await progressTx.done;
        }
      }

      // Save last sync time
      const now = new Date();
      await dbRef.current.put('config', { key: 'lastSyncAt', value: now.toISOString() });

      setSyncStatus(s => ({
        ...s,
        isSyncing: false,
        lastSyncAt: now,
        pendingActions: actions.length - successfulIds.length
      }));

      // Register background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.registration!) {
        try {
          await (window as Window & { registration?: ServiceWorkerRegistration }).registration?.sync.register('sync-offline-actions');
        } catch {
          // Background sync not supported
        }
      }

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(s => ({
        ...s,
        isSyncing: false,
        error: (error as Error).message
      }));
    }
  }, [isOnline, syncStatus.isSyncing, syncStatus.lastSyncAt]);

  const clearAllOfflineData = useCallback(async () => {
    if (!dbRef.current) return;

    await dbRef.current.clear('actions');
    await dbRef.current.clear('progress');
    await dbRef.current.clear('content');
    await dbRef.current.clear('config');

    setSyncStatus({
      isSyncing: false,
      lastSyncAt: null,
      pendingActions: 0,
      error: null
    });
  }, []);

  return {
    isOnline,
    syncStatus,
    saveProgress,
    getProgress,
    addFavorite,
    removeFavorite,
    addBookmark,
    removeBookmark,
    saveRating,
    downloadContent,
    getDownloadedContent,
    getDownloadedContentList,
    removeDownloadedContent,
    syncNow,
    clearAllOfflineData
  };
}

export default useOfflineSync;
