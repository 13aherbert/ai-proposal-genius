import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PricingTier } from './subscription/subscription-features-types';

export type { PricingTier } from './subscription/subscription-features-types';

export interface PricingTierResult {
  tier: PricingTier | null;
  isLoading: boolean;
  error: Error | null;
  canAddUser: (teamSize: number) => boolean;
  getUserLimitDisplay: () => string;
  getUpgradeValueProp: () => string;
  getProjectsLimitDisplay: () => string;
}

const tierCache = new Map<string, PricingTier>();

/**
 * Fetches and exposes pricing tier data with user-limit helpers.
 * Accepts `plan` as a parameter to avoid circular dependency with useSubscriptionFeatures.
 */
export function usePricingTier(plan: string): PricingTierResult {
  const [tier, setTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Map legacy plan names to new pricing tier slugs
  const tierSlug = useMemo(() => {
    const normalized = (plan || 'starter').toLowerCase();
    const slugMap: Record<string, string> = {
      starter: 'starter',
      basic: 'growth',
      pro: 'business',
      enterprise: 'enterprise',
      growth: 'growth',
      business: 'business',
      trial: 'starter',
    };
    return slugMap[normalized] || 'starter';
  }, [plan]);

  useEffect(() => {
    let cancelled = false;

    const fetchTier = async () => {
      if (tierCache.has(tierSlug)) {
        setTier(tierCache.get(tierSlug)!);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('slug', tierSlug)
          .eq('is_active', true)
          .single();

        if (fetchError) throw fetchError;

        if (!cancelled && data) {
          const parsed: PricingTier = {
            id: data.id,
            name: data.name,
            slug: data.slug,
            monthly_price: data.monthly_price,
            annual_price: data.annual_price,
            projects_limit: data.projects_limit,
            users_limit: data.users_limit,
            features: Array.isArray(data.features) ? data.features as string[] : [],
            is_active: data.is_active,
          };
          tierCache.set(tierSlug, parsed);
          setTier(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching pricing tier:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTier();
    return () => { cancelled = true; };
  }, [tierSlug]);

  const canAddUser = useCallback((teamSize: number): boolean => {
    if (!tier) return false;
    if (tier.users_limit === -1) return true;
    return teamSize < tier.users_limit;
  }, [tier]);

  const getUserLimitDisplay = useCallback((): string => {
    if (!tier) return '';
    if (tier.users_limit === -1) return 'Unlimited team members';
    return `${tier.users_limit} user${tier.users_limit !== 1 ? 's' : ''}`;
  }, [tier]);

  const getUpgradeValueProp = useCallback((): string => {
    if (!tier || tier.slug === 'starter') {
      return 'Add unlimited team members';
    }
    return 'Get more projects and features';
  }, [tier]);

  const getProjectsLimitDisplay = useCallback((): string => {
    if (!tier) return '';
    if (tier.projects_limit === -1) return 'Unlimited projects';
    return `${tier.projects_limit} project${tier.projects_limit !== 1 ? 's' : ''}`;
  }, [tier]);

  return {
    tier,
    isLoading,
    error,
    canAddUser,
    getUserLimitDisplay,
    getUpgradeValueProp,
    getProjectsLimitDisplay,
  };
}
