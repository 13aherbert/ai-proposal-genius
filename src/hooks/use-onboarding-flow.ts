import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

const STORAGE_KEYS = {
  step: 'onboarding_step',
  skipped: 'onboarding_skipped',
  completed: 'onboarding_completed',
  dismissed: 'onboarding_banner_dismissed',
};

export function useOnboardingFlow() {
  const { session } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.step);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSkipped, setIsSkipped] = useState(() => localStorage.getItem(STORAGE_KEYS.skipped) === 'true');
  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(STORAGE_KEYS.completed) === 'true');
  const [isDismissed, setIsDismissed] = useState(() => localStorage.getItem(STORAGE_KEYS.dismissed) === 'true');

  // Auto-open for new users (< 24h) who haven't completed or skipped
  useEffect(() => {
    if (!session?.user) return;
    if (isCompleted || isSkipped) return;
    const created = new Date(session.user.created_at);
    const isNew = Date.now() - created.getTime() < 24 * 60 * 60 * 1000;
    if (isNew) {
      setIsOpen(true);
    }
  }, [session, isCompleted, isSkipped]);

  const persistStep = useCallback((step: number) => {
    localStorage.setItem(STORAGE_KEYS.step, String(step));
  }, []);

  const next = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, 6);
      persistStep(next);
      return next;
    });
  }, [persistStep]);

  const back = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.max(prev - 1, 1);
      persistStep(next);
      return next;
    });
  }, [persistStep]);

  const skip = useCallback(() => {
    setIsSkipped(true);
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEYS.skipped, 'true');
  }, []);

  const complete = useCallback(() => {
    setIsCompleted(true);
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEYS.completed, 'true');
    localStorage.removeItem(STORAGE_KEYS.step);
  }, []);

  const resume = useCallback(() => {
    setIsSkipped(false);
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEYS.skipped);
    localStorage.removeItem(STORAGE_KEYS.dismissed);
    setIsOpen(true);
  }, []);

  const reopen = useCallback(() => {
    setIsSkipped(false);
    setIsCompleted(false);
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEYS.skipped);
    localStorage.removeItem(STORAGE_KEYS.completed);
    localStorage.removeItem(STORAGE_KEYS.dismissed);
    setCurrentStep(1);
    persistStep(1);
    setIsOpen(true);
  }, [persistStep]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.dismissed, 'true');
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    persistStep(step);
  }, [persistStep]);

  const showBanner = isSkipped && !isCompleted && !isDismissed;

  return {
    currentStep,
    isOpen,
    setIsOpen,
    isSkipped,
    isCompleted,
    showBanner,
    next,
    back,
    skip,
    complete,
    resume,
    reopen,
    dismiss,
    goToStep,
  };
}
