import { useCallback, useEffect, useRef, useState } from 'react';

const DISMISSED_KEY = 'i8e10_install_banner_dismissed_at';
const COOLDOWN_DAYS = 7;
const ENGAGEMENT_DELAY_MS = 10_000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptResult {
  showBanner: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

/**
 * Hook that manages the A2HS (Add to Home Screen) install prompt.
 *
 * @param isReady - Must be true before the engagement timer starts.
 *   Pass `true` only when the app is unlocked and onboarding is done/skipped.
 */
export function useInstallPrompt(isReady: boolean): UseInstallPromptResult {
  const [showBanner, setShowBanner] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const engagementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engaged = useRef(false);

  // --- Check if the app is already in standalone mode ---
  const isStandalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches;

  // --- Check if the banner was dismissed within the cool-down period ---
  const isDismissedRecently = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (!raw) return false;
      const dismissedAt = Number(raw);
      if (Number.isNaN(dismissedAt)) return false;
      const elapsed = Date.now() - dismissedAt;
      return elapsed < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }, []);

  // --- Try to show the banner if all conditions are met ---
  const maybeShow = useCallback(() => {
    if (
      deferredPrompt.current &&
      engaged.current &&
      !isDismissedRecently()
    ) {
      setShowBanner(true);
    }
  }, [isDismissedRecently]);

  // --- Capture the beforeinstallprompt event ---
  useEffect(() => {
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault(); // Suppress the mini-infobar
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      maybeShow();
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone, maybeShow]);

  // --- Start the engagement timer only when isReady becomes true ---
  useEffect(() => {
    if (isStandalone || !isReady || engaged.current) return;

    engagementTimer.current = setTimeout(() => {
      engaged.current = true;
      maybeShow();
    }, ENGAGEMENT_DELAY_MS);

    return () => {
      if (engagementTimer.current) {
        clearTimeout(engagementTimer.current);
      }
    };
  }, [isReady, isStandalone, maybeShow]);

  // --- Auto-hide on appinstalled ---
  useEffect(() => {
    const handler = () => {
      deferredPrompt.current = null;
      setShowBanner(false);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // --- Install action ---
  const onInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setShowBanner(false);
    }
  }, []);

  // --- Dismiss action ---
  const onDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // localStorage may be unavailable in rare cases
    }
    setShowBanner(false);
  }, []);

  return { showBanner: showBanner && !isStandalone, onInstall, onDismiss };
}
