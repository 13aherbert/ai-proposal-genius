import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
  step: 'onboarding_step',
  dismissed: 'onboarding_banner_dismissed',
};

export function useOnboardingFlow() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.step);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => localStorage.getItem(STORAGE_KEYS.dismissed) === 'true');
  const [isLoaded, setIsLoaded] = useState(false);
  const hasAutoOpened = useRef(false);

  // Load onboarding state from Supabase profile
  useEffect(() => {
    if (!userId) return;
    
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_skipped_at')
        .eq('profile_id', userId)
        .single();
      
      if (data) {
        setIsCompleted(data.onboarding_completed ?? false);
        setIsSkipped(!!data.onboarding_skipped_at);
      }
      setIsLoaded(true);
    };
    load();
  }, [userId]);

  // Auto-open for new users (< 24h) who haven't completed or skipped
  useEffect(() => {
    if (!session?.user || !isLoaded || hasAutoOpened.current) return;
    if (isCompleted || isSkipped) return;
    const created = new Date(session.user.created_at);
    const isNew = Date.now() - created.getTime() < 24 * 60 * 60 * 1000;
    if (isNew) {
      hasAutoOpened.current = true;
      setIsOpen(true);
    }
  }, [session, isCompleted, isSkipped, isLoaded]);

  const persistStep = useCallback((step: number) => {
    localStorage.setItem(STORAGE_KEYS.step, String(step));
  }, []);

  const saveToProfile = useCallback(async (updates: { onboarding_completed?: boolean; onboarding_skipped_at?: string | null }) => {
    if (!userId) return;
    await supabase
      .from('profiles')
      .update(updates)
      .eq('profile_id', userId);
  }, [userId]);

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
    saveToProfile({ onboarding_completed: true, onboarding_skipped_at: new Date().toISOString() });
  }, [saveToProfile]);

  const complete = useCallback(() => {
    setIsCompleted(true);
    setIsOpen(false);
    localStorage.removeItem(STORAGE_KEYS.step);
    saveToProfile({ onboarding_completed: true, onboarding_skipped_at: null });
  }, [saveToProfile]);

  const resume = useCallback(() => {
    setIsSkipped(false);
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEYS.dismissed);
    setIsOpen(true);
    saveToProfile({ onboarding_skipped_at: null });
  }, [saveToProfile]);

  const reopen = useCallback(() => {
    setIsSkipped(false);
    setIsCompleted(false);
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEYS.dismissed);
    setCurrentStep(1);
    persistStep(1);
    hasAutoOpened.current = false;
    setIsOpen(true);
    saveToProfile({ onboarding_completed: false, onboarding_skipped_at: null });
  }, [persistStep, saveToProfile]);

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
