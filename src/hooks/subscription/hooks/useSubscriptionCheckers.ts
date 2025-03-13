
import { useCallback } from 'react';
import { SubscriptionPlan } from '@/types/subscription';
import { isPast, addDays } from 'date-fns';

export function useSubscriptionCheckers(subscription: SubscriptionPlan | null) {
  // Check if subscription is past grace period
  const checkIsPastGracePeriod = useCallback(() => {
    if (!subscription?.current_period_end) return false;
    
    // Status check - only cancelled/past_due/unpaid subscriptions can be in grace period
    if (!['canceled', 'past_due', 'unpaid'].includes(subscription.status)) {
      return false;
    }
    
    const endDate = new Date(subscription.current_period_end);
    const gracePeriodEnd = addDays(endDate, 3); // 3-day grace period
    
    return isPast(gracePeriodEnd);
  }, [subscription]);
  
  // Check if subscription is in grace period
  const checkIsInGracePeriod = useCallback(() => {
    if (!subscription?.current_period_end) return false;
    
    // Status check - only cancelled/past_due/unpaid subscriptions can be in grace period
    if (!['canceled', 'past_due', 'unpaid'].includes(subscription.status)) {
      return false;
    }
    
    const endDate = new Date(subscription.current_period_end);
    const gracePeriodEnd = addDays(endDate, 3); // 3-day grace period
    
    return isPast(endDate) && !isPast(gracePeriodEnd);
  }, [subscription]);
  
  // Check if subscription is active
  const checkIsActive = useCallback(() => {
    if (!subscription) return false;
    
    // Trial is considered active
    if (subscription.status === 'trialing') return true;
    
    // Normal active check
    if (subscription.status === 'active') {
      // If it has an end date, check if it's still valid
      if (subscription.current_period_end) {
        return !isPast(new Date(subscription.current_period_end));
      }
      
      // If no end date, it's considered active
      return true;
    }
    
    // Check grace period for other statuses
    return checkIsInGracePeriod();
  }, [subscription, checkIsInGracePeriod]);
  
  // Check if subscription has failed payment
  const checkHasFailedPayment = useCallback(() => {
    if (!subscription) return false;
    
    return subscription.status === 'past_due' || subscription.status === 'unpaid';
  }, [subscription]);
  
  return {
    checkIsPastGracePeriod,
    checkIsInGracePeriod,
    checkIsActive,
    checkHasFailedPayment,
  };
}
