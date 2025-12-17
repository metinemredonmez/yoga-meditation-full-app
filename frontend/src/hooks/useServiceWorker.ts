import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  cacheContent: (urls: string[]) => void;
  clearCache: (cacheName?: string) => void;
  getCacheSize: () => Promise<number>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<PushSubscription | null>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    isUpdateAvailable: false,
    registration: null
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setState(s => ({ ...s, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check service worker support
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setState(s => ({ ...s, isSupported }));

    if (isSupported) {
      // Check if already registered
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setState(s => ({
            ...s,
            isRegistered: true,
            registration
          }));
        }
      });
    }
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if (!state.registration) return;

    const handleUpdateFound = () => {
      const newWorker = state.registration?.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(s => ({ ...s, isUpdateAvailable: true }));
          }
        });
      }
    };

    state.registration.addEventListener('updatefound', handleUpdateFound);

    return () => {
      state.registration?.removeEventListener('updatefound', handleUpdateFound);
    };
  }, [state.registration]);

  const register = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setState(s => ({
        ...s,
        isRegistered: true,
        registration
      }));

      console.log('Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, [state.isSupported]);

  const unregister = useCallback(async () => {
    if (!state.registration) return;

    const success = await state.registration.unregister();

    if (success) {
      setState(s => ({
        ...s,
        isRegistered: false,
        registration: null
      }));
    }
  }, [state.registration]);

  const update = useCallback(async () => {
    if (!state.registration) return;
    await state.registration.update();
  }, [state.registration]);

  const skipWaiting = useCallback(() => {
    if (!state.registration?.waiting) return;

    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setState(s => ({ ...s, isUpdateAvailable: false }));

    // Reload to activate new service worker
    window.location.reload();
  }, [state.registration]);

  const cacheContent = useCallback((urls: string[]) => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_CONTENT',
      urls
    });
  }, []);

  const clearCache = useCallback((cacheName?: string) => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE',
      cacheName
    });
  }, []);

  const getCacheSize = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve(0);
        return;
      }

      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.registration) return null;

    try {
      const subscription = await state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [state.registration]);

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    cacheContent,
    clearCache,
    getCacheSize,
    requestNotificationPermission,
    subscribeToPush
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default useServiceWorker;
