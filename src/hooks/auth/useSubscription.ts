
import { useState, useCallback, useMemo } from 'react';
import { SubscriptionPlan } from '@/types/subscription';

/**
 * Hook for managing subscription status and helper functions
 * Provides boolean flags for different subscription states
 */
export function useSubscription(subscription: SubscriptionPlan | null = null) {
  // Memoized computed properties for subscription status
  const isActive = useMemo(() => {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trialing';
  }, [subscription]);

  const isInGracePeriod = useMemo(() => {
    if (!subscription) return false;
    
    // Check if canceled but current_period_end is in the future
    if (subscription.status === 'canceled' && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 day grace period
      
      return now > periodEnd && now < gracePeriodEnd;
    }
    
    return false;
  }, [subscription]);

  const isPastGracePeriod = useMemo(() => {
    if (!subscription) return false;
    
    // Check if canceled and current_period_end plus grace period is in the past
    if (subscription.status === 'canceled' && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 day grace period
      
      return now > gracePeriodEnd;
    }
    
    return false;
  }, [subscription]);

  const hasFailedPayment = useMemo(() => {
    if (!subscription) return false;
    return subscription.status === 'past_due' || subscription.status === 'unpaid';
  }, [subscription]);

  return {
    isActive,
    isInGracePeriod,
    isPastGracePeriod,
    hasFailedPayment
  };
}
