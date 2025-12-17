'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, Check } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineIndicator() {
  const { isOnline, syncStatus, syncNow } = useOfflineSync();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show reconnected message briefly
      setShowBanner(true);
      setShowSyncSuccess(true);

      const timeout = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
        setShowSyncSuccess(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, wasOffline]);

  // Don't render anything if online and never was offline
  if (!showBanner && isOnline) return null;

  return (
    <>
      {/* Fixed banner at top */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showBanner ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div
          className={`px-4 py-3 ${
            isOnline
              ? 'bg-green-500'
              : 'bg-amber-500'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <>
                  {showSyncSuccess ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Wifi className="w-5 h-5 text-white" />
                  )}
                  <span className="text-sm font-medium text-white">
                    {syncStatus.isSyncing
                      ? 'Veriler senkronize ediliyor...'
                      : showSyncSuccess
                        ? 'Bağlantı yeniden kuruldu'
                        : 'Çevrimiçi'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-white" />
                  <span className="text-sm font-medium text-white">
                    Çevrimdışısınız - Değişiklikler kaydedilecek
                  </span>
                </>
              )}
            </div>

            {/* Sync button when online with pending actions */}
            {isOnline && syncStatus.pendingActions > 0 && (
              <button
                onClick={() => syncNow()}
                disabled={syncStatus.isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                {syncStatus.pendingActions} bekleyen
              </button>
            )}

            {/* Close button */}
            {isOnline && (
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating indicator when offline */}
      {!isOnline && !showBanner && (
        <button
          onClick={() => setShowBanner(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors"
        >
          <CloudOff className="w-4 h-4" />
          <span className="text-sm font-medium">Çevrimdışı</span>
        </button>
      )}
    </>
  );
}
