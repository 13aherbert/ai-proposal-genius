import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEYS = {
  SIGNED_UP: 'optirfp_signed_up',
  DISMISSED: 'optirfp_exit_dismissed',
} as const;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_TIME_ON_PAGE_MS = 30_000;
const SCROLL_THRESHOLD = 500;
const SCROLL_TIME_THRESHOLD = 200;

interface UseExitIntentOptions {
  isLoggedIn: boolean;
}

export function useExitIntent({ isLoggedIn }: UseExitIntentOptions) {
  const [showModal, setShowModal] = useState(false);
  const hasTriggered = useRef(false);
  const hasMoved = useRef(false);

  const isSuppressed = useCallback(() => {
    if (isLoggedIn) return true;
    if (localStorage.getItem(STORAGE_KEYS.SIGNED_UP)) return true;
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < SEVEN_DAYS_MS) return true;
    return false;
  }, [isLoggedIn]);

  const trigger = useCallback(() => {
    if (hasTriggered.current || !hasMoved.current) return;
    hasTriggered.current = true;
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (isSuppressed()) return;

    const onMove = () => { hasMoved.current = true; };
    document.addEventListener('mousemove', onMove, { once: true, passive: true });

    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    let cleanupListeners: (() => void) | null = null;

    const timer = setTimeout(() => {
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY < 10) trigger();
      };

      const onScroll = () => {
        const now = Date.now();
        const currentY = window.scrollY;
        const diff = lastScrollY - currentY;
        const elapsed = now - lastScrollTime;

        if (diff > SCROLL_THRESHOLD && elapsed < SCROLL_TIME_THRESHOLD) {
          trigger();
        }

        lastScrollY = currentY;
        lastScrollTime = now;
      };

      document.addEventListener('mouseleave', onMouseLeave);
      window.addEventListener('scroll', onScroll, { passive: true });

      cleanupListeners = () => {
        document.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('scroll', onScroll);
      };
    }, MIN_TIME_ON_PAGE_MS);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', onMove);
      cleanupListeners?.();
    };
  }, [isSuppressed, trigger]);

  const dismiss = useCallback(() => {
    setShowModal(false);
    localStorage.setItem(STORAGE_KEYS.DISMISSED, Date.now().toString());
  }, []);

  const close = useCallback(() => {
    setShowModal(false);
  }, []);

  const signUp = useCallback(() => {
    setShowModal(false);
    localStorage.setItem(STORAGE_KEYS.SIGNED_UP, 'true');
  }, []);

  return { showModal, dismiss, close, signUp };
}
