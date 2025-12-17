// Service Worker for Yoga App PWA
const CACHE_NAME = 'yoga-app-v1';
const STATIC_CACHE = 'yoga-static-v1';
const DYNAMIC_CACHE = 'yoga-dynamic-v1';
const OFFLINE_CACHE = 'yoga-offline-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/css/main.css',
  '/js/main.js'
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/mobile/config',
  '/api/mobile/home',
  '/api/mobile/explore',
  '/api/poses',
  '/api/programs'
];

// ============================================
// Install Event
// ============================================
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => !asset.startsWith('/api')));
      })
      .then(() => {
        // Force activation without waiting
        return self.skipWaiting();
      })
  );
});

// ============================================
// Activate Event
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== OFFLINE_CACHE) {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// ============================================
// Fetch Event
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: Network first, cache fallback
  event.respondWith(handleDynamicRequest(request));
});

// ============================================
// Request Handlers
// ============================================

async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this is a cacheable API route
  const isCacheable = API_CACHE_ROUTES.some(route => url.pathname.startsWith(route));

  if (isCacheable) {
    // Network first, cache fallback (Stale-While-Revalidate)
    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      console.log('[ServiceWorker] Network failed, trying cache:', url.pathname);

      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Return offline JSON response
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'You are currently offline',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Non-cacheable API: Network only
  return fetch(request);
}

async function handleStaticRequest(request) {
  // Cache first, network fallback
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Static asset fetch failed:', request.url);
    // Return a placeholder for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
      return caches.match('/icons/placeholder.png');
    }
    throw error;
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation failed, serving offline page');

    // Try to return cached page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return caches.match('/offline.html');
  }
}

async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

// ============================================
// Background Sync
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync:', event.tag);

  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }

  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncOfflineActions() {
  try {
    // Get pending actions from IndexedDB
    const actions = await getOfflineActions();

    if (actions.length === 0) {
      return;
    }

    // Send to server
    const response = await fetch('/api/offline/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAuthToken()
      },
      body: JSON.stringify({
        offlineActions: actions,
        deviceId: await getDeviceId()
      })
    });

    if (response.ok) {
      // Clear synced actions
      await clearOfflineActions(actions.map(a => a.id));
      console.log('[ServiceWorker] Offline actions synced successfully');
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync offline actions:', error);
  }
}

async function syncProgress() {
  try {
    const progress = await getPendingProgress();

    if (progress.length === 0) {
      return;
    }

    const response = await fetch('/api/progress/video/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAuthToken()
      },
      body: JSON.stringify({ progress })
    });

    if (response.ok) {
      await clearPendingProgress();
      console.log('[ServiceWorker] Progress synced successfully');
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync progress:', error);
  }
}

// ============================================
// Push Notifications
// ============================================
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  let data = {
    title: 'Yoga App',
    body: 'Yeni bir bildirim var!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Aç' },
      { action: 'close', title: 'Kapat' }
    ],
    tag: data.tag || 'yoga-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// IndexedDB Helpers
// ============================================
const DB_NAME = 'yoga-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'classId' });
      }

      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
}

async function getOfflineActions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('actions', 'readonly');
    const store = transaction.objectStore('actions');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function clearOfflineActions(ids) {
  const db = await openDB();
  const transaction = db.transaction('actions', 'readwrite');
  const store = transaction.objectStore('actions');

  for (const id of ids) {
    store.delete(id);
  }
}

async function getPendingProgress() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('progress', 'readonly');
    const store = transaction.objectStore('progress');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function clearPendingProgress() {
  const db = await openDB();
  const transaction = db.transaction('progress', 'readwrite');
  const store = transaction.objectStore('progress');
  store.clear();
}

async function getAuthToken() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get('authToken');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.value || '');
  });
}

async function getDeviceId() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get('deviceId');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (request.result?.value) {
        resolve(request.result.value);
      } else {
        // Generate new device ID
        const newId = 'sw-' + Math.random().toString(36).substr(2, 9);
        resolve(newId);
      }
    };
  });
}

// ============================================
// Message Handler
// ============================================
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_CONTENT') {
    event.waitUntil(cacheOfflineContent(event.data.urls));
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearCache(event.data.cacheName));
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

async function cacheOfflineContent(urls) {
  const cache = await caches.open(OFFLINE_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[ServiceWorker] Cached:', url);
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to cache:', url, error);
    }
  }
}

async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  console.log('[ServiceWorker] Cache cleared');
}

async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

console.log('[ServiceWorker] Loaded');
