
import { useCallback } from 'react';
import { useUserStatus } from '@/hooks/use-user-status';
import { SubscriptionPlan } from '@/types/subscription';
import { 
  isPastGracePeriod as isPastGracePeriodUtil,
  isInGracePeriod as isInGracePeriodUtil, 
  isActive as isActiveUtil, 
  hasFailedPayment as hasFailedPaymentUtil
} from '@/hooks/subscription/use-subscription-helpers';

export function useSubscriptionCheckers() {
  const { status, subscription } = useUserStatus();
  
  const isPastGracePeriod = useCallback(() => {
    // Use the utility function with our subscription data
    return isPastGracePeriodUtil(subscription);
  }, [subscription]);

  const isInGracePeriod = useCallback(() => {
    // Use the utility function with our subscription data
    return isInGracePeriodUtil(subscription);
  }, [subscription]);

  const isActive = useCallback(() => {
    // Use the utility function with our subscription data
    return isActiveUtil(subscription);
  }, [subscription]);

  const hasFailedPayment = useCallback(() => {
    // Use the utility function with our subscription data
    return hasFailedPaymentUtil(subscription);
  }, [subscription]);

  return {
    isPastGracePeriod,
    isInGracePeriod,
    isActive,
    hasFailedPayment,
  };
}
