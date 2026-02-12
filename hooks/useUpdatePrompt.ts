import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface UseUpdatePromptResult {
  showBanner: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * Hook that detects when a new Service Worker is waiting and exposes
 * controls to either apply the update or dismiss the banner.
 *
 * - The banner appears immediately when `onNeedRefresh` fires (no delay).
 * - "Update Now" calls `skipWaiting` + reloads the page.
 * - "Dismiss" hides the banner; the update will activate on the next
 *   browser restart / manual page reload.
 *
 * NOTE: `registerSW`'s `onNeedRefresh` only fires on state *transitions*.
 * If a SW was already waiting before this page load, we detect it manually
 * via `navigator.serviceWorker.ready`.
 */
export function useUpdatePrompt(): UseUpdatePromptResult {
  const [showBanner, setShowBanner] = useState(false);
  const updateSW = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSW.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setShowBanner(true);
      },
      // onOfflineReady is intentionally omitted — we don't show a banner for it.
    });

    // Also detect a SW that was already in the "waiting" state before
    // registerSW was called (the workbox-window events won't fire for it).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setShowBanner(true);
        }
      });
    }
  }, []);

  const onUpdate = useCallback(() => {
    updateSW.current?.(true); // skipWaiting + reload
  }, []);

  const onDismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  return { showBanner, onUpdate, onDismiss };
}

