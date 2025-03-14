
import { useCallback } from 'react';
import { useUserStatus } from '@/hooks/use-user-status';
import { SubscriptionPlan } from '@/types/subscription';

export function useSubscriptionCheckers() {
  const { status, subscription } = useUserStatus();
  
  const isPastGracePeriod = useCallback(() => {
    // Get subscription data from most reliable source
    const subData = subscription || {};
    
    // If we have no plan or no period end, we can't be past grace period
    if (!subData.subscription_id || !subData.current_period_end) {
      return false;
    }

    // Check for failed payment statuses
    const failedStatuses = ['past_due', 'unpaid', 'incomplete_expired'];
    if (!failedStatuses.includes(subData.status)) {
      return false;
    }

    // Calculate grace period (7 days after period end)
    const periodEndDate = new Date(subData.current_period_end);
    const gracePeriodEnd = new Date(periodEndDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    return new Date() > gracePeriodEnd;
  }, [subscription]);

  const isInGracePeriod = useCallback(() => {
    // Get subscription data from most reliable source
    const subData = subscription || {};
    
    // If we have no plan or no period end, we can't be in grace period
    if (!subData.subscription_id || !subData.current_period_end) {
      return false;
    }

    // Check for failed payment statuses
    const failedStatuses = ['past_due', 'unpaid', 'incomplete_expired'];
    if (!failedStatuses.includes(subData.status)) {
      return false;
    }

    // Calculate grace period (7 days after period end)
    const periodEndDate = new Date(subData.current_period_end);
    const gracePeriodEnd = new Date(periodEndDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    const now = new Date();
    return now > periodEndDate && now <= gracePeriodEnd;
  }, [subscription]);

  const isActive = useCallback(() => {
    // Get subscription status from most reliable source
    const subStatus = status?.subscription_status || subscription?.status || 'trialing';
    
    // Active subscriptions include trial period
    const activeStatuses = ['trialing', 'active'];
    return activeStatuses.includes(subStatus);
  }, [status, subscription]);

  const hasFailedPayment = useCallback(() => {
    // Get subscription status from most reliable source
    const subStatus = status?.subscription_status || subscription?.status || 'trialing';
    
    // Failed payment statuses
    const failedStatuses = ['past_due', 'unpaid', 'incomplete_expired', 'incomplete'];
    return failedStatuses.includes(subStatus);
  }, [status, subscription]);

  return {
    isPastGracePeriod,
    isInGracePeriod,
    isActive,
    hasFailedPayment,
  };
}
