import { useState, useEffect, useCallback, useRef } from "react";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "failed";

interface UseAutoSaveOptions {
  /** Debounce delay in ms (default 2000) */
  delay?: number;
  /** Key for localStorage backup */
  storageKey?: string;
  /** Save function that returns a promise */
  onSave: () => Promise<void>;
}

export function useAutoSave({ delay = 2000, storageKey, onSave }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const executeSave = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus("saving");
    try {
      await onSave();
      if (!mountedRef.current) return;
      setStatus("saved");
      // Clear localStorage backup on successful save
      if (storageKey) {
        try { localStorage.removeItem(storageKey); } catch {}
      }
      // Fade status back to idle after 3s
      savedTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setStatus("idle");
      }, 3000);
    } catch {
      if (mountedRef.current) setStatus("failed");
    }
  }, [onSave, storageKey]);

  /** Call when content changes */
  const markDirty = useCallback((backupContent?: string) => {
    setStatus("unsaved");
    // localStorage backup
    if (storageKey && backupContent !== undefined) {
      try { localStorage.setItem(storageKey, backupContent); } catch {}
    }
    // Reset debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    timerRef.current = setTimeout(() => {
      executeSave();
    }, delay);
  }, [delay, executeSave, storageKey]);

  /** Immediate save (manual button or blur) */
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    executeSave();
  }, [executeSave]);

  /** Retry after failure */
  const retry = useCallback(() => {
    executeSave();
  }, [executeSave]);

  return { status, markDirty, saveNow, retry };
}
