import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Step } from 'react-joyride';

const STORAGE_KEY = 'optirfp_product_tour';
const CONTEXTUAL_PREFIX = 'optirfp_ctx_tip_';

interface TourState {
  completed: boolean;
  skippedAt: string | null;
  lastStep: number;
}

function loadState(): TourState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: false, skippedAt: null, lastStep: 0 };
}

function saveState(state: TourState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type TourStepPage = 'dashboard' | 'projects' | 'editor' | 'knowledge' | 'opportunities' | 'account';

export interface ProductTourStep extends Step {
  page?: TourStepPage;
  tierMessage?: string;
  requiredPlan?: string;
}

export function getProductTourSteps(planType: string = 'starter'): ProductTourStep[] {
  const isFreeTier = planType === 'starter';

  return [
    {
      target: '[data-tour="dashboard-header"]',
      content: 'Welcome to OptiRFP! This is your command center — see your projects, track activity, and jump into key actions from here.',
      title: 'Your Dashboard',
      placement: 'bottom',
      disableBeacon: true,
      page: 'dashboard',
    },
    {
      target: '[data-tour="quick-upload"]',
      content: 'Upload an RFP document to instantly create a new project. We\'ll parse it and get you started with AI-powered analysis.',
      title: 'Upload an RFP',
      placement: 'bottom',
      page: 'dashboard',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'Quick actions give you one-click access to your projects, knowledge base, and opportunity search.',
      title: 'Quick Actions',
      placement: 'top',
      page: 'dashboard',
    },
    {
      target: '[data-tour="nav-projects"]',
      content: 'All your proposal projects live here. Each project tracks the full lifecycle — from RFP upload through proposal drafting and review.',
      title: 'Your Projects',
      placement: 'bottom',
      page: 'dashboard',
    },
    {
      target: '[data-tour="nav-knowledge"]',
      content: 'Build a reusable content library — past proposals, company info, certifications — so AI can write better proposals faster.',
      title: 'Knowledge Base',
      placement: 'bottom',
      page: 'dashboard',
    },
    {
      target: '[data-tour="nav-discover"]',
      content: isFreeTier
        ? 'Search for government RFP opportunities. Upgrade to Growth for up to 10 searches/month, or Business for unlimited.'
        : 'Search for government RFP opportunities matching your expertise and past wins.',
      title: 'Opportunity Finder',
      placement: 'bottom',
      page: 'dashboard',
      tierMessage: isFreeTier ? 'Available on Growth plan and above' : undefined,
    },
    {
      target: '[data-tour="usage-widget"]',
      content: isFreeTier
        ? 'Track your project usage here. You\'re on the Starter plan with 6 projects/year. Upgrade to unlock more capacity and premium features.'
        : `You're on the ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan. Track your usage and manage your subscription here.`,
      title: 'Plan & Usage',
      placement: 'top',
      page: 'dashboard',
      tierMessage: isFreeTier ? 'Upgrade for more projects, team features, AI evaluation, and integrations' : undefined,
    },
    {
      target: '[data-tour="recent-activity"]',
      content: 'Your recent work appears here — quick access to jump back into active projects and see what\'s changed.',
      title: 'Recent Activity',
      placement: 'top',
      page: 'dashboard',
    },
    {
      target: '[data-tour="user-menu"]',
      content: 'Access your account settings, manage your subscription, and restart this tour anytime from the user menu.',
      title: 'Account & Settings',
      placement: 'bottom-end',
      page: 'dashboard',
    },
  ];
}

export function useProductTour() {
  const { session } = useAuth();
  const location = useLocation();
  const [state, setState] = useState<TourState>(loadState);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const hasAutoStarted = useRef(false);

  const start = useCallback(() => {
    setStepIndex(0);
    setState({ completed: false, skippedAt: null, lastStep: 0 });
    saveState({ completed: false, skippedAt: null, lastStep: 0 });
    hasAutoStarted.current = true;
    setIsRunning(true);
  }, []);

  // Auto-start for new users who haven't completed or skipped the tour
  useEffect(() => {
    if (!session?.user || hasAutoStarted.current) return;
    if (state.completed || state.skippedAt) return;
    if (location.pathname !== '/dashboard') return;

    const created = new Date(session.user.created_at);
    const isNew = Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
    if (isNew) {
      hasAutoStarted.current = true;
      setTimeout(() => setIsRunning(true), 2000);
    }
  }, [session, state.completed, state.skippedAt, location.pathname]);

  // Listen for restart-product-tour event from Navbar
  useEffect(() => {
    const handler = () => start();
    window.addEventListener('restart-product-tour', handler);
    return () => window.removeEventListener('restart-product-tour', handler);
  }, [start]);

  const complete = useCallback(() => {
    const newState: TourState = { completed: true, skippedAt: null, lastStep: stepIndex };
    setState(newState);
    saveState(newState);
    setIsRunning(false);
  }, [stepIndex]);

  const skip = useCallback(() => {
    const newState: TourState = { completed: false, skippedAt: new Date().toISOString(), lastStep: stepIndex };
    setState(newState);
    saveState(newState);
    setIsRunning(false);
  }, [stepIndex]);

  const setStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  // Contextual help: mark a feature as seen
  const markFeatureSeen = useCallback((featureId: string) => {
    localStorage.setItem(CONTEXTUAL_PREFIX + featureId, 'true');
  }, []);

  const isFeatureSeen = useCallback((featureId: string) => {
    return localStorage.getItem(CONTEXTUAL_PREFIX + featureId) === 'true';
  }, []);

  return {
    isRunning,
    stepIndex,
    isCompleted: state.completed,
    isSkipped: !!state.skippedAt,
    start,
    complete,
    skip,
    setStep,
    setIsRunning,
    markFeatureSeen,
    isFeatureSeen,
  };
}
