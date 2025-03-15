
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
  
  // Direct boolean evaluations, not function returns
  const isPastGracePeriod = isPastGracePeriodUtil(subscription);
  const isInGracePeriod = isInGracePeriodUtil(subscription);
  const isActive = isActiveUtil(subscription);
  const hasFailedPayment = hasFailedPaymentUtil(subscription);

  return {
    isPastGracePeriod,
    isInGracePeriod,
    isActive,
    hasFailedPayment,
  };
}
