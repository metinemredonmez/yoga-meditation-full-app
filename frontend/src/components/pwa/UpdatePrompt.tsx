'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import useServiceWorker from '@/hooks/useServiceWorker';

export default function UpdatePrompt() {
  const { isUpdateAvailable, skipWaiting } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">
              Yeni Sürüm Mevcut
            </h3>
            <p className="text-sm text-white/80 mt-0.5">
              Daha iyi bir deneyim için uygulamayı güncelleyin
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={skipWaiting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-medium hover:bg-white/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Güncelle
              </button>
              <button
                onClick={() => {
                  // Just dismiss - update will happen on next reload
                  const event = new CustomEvent('dismiss-update');
                  window.dispatchEvent(event);
                }}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Sonra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
