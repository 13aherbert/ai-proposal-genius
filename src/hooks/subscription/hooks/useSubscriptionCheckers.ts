
import { 
  isPastGracePeriod, 
  isInGracePeriod, 
  isActive, 
  hasFailedPayment 
} from '../use-subscription-helpers';
import { SubscriptionPlan } from '@/types/subscription';

/**
 * Creates subscription status checker functions
 */
export function useSubscriptionCheckers(subscription: SubscriptionPlan | null) {
  const checkIsPastGracePeriod = () => isPastGracePeriod(subscription);
  const checkIsInGracePeriod = () => isInGracePeriod(subscription);
  const checkIsActive = () => isActive(subscription);
  const checkHasFailedPayment = () => hasFailedPayment(subscription);

  return {
    checkIsPastGracePeriod,
    checkIsInGracePeriod,
    checkIsActive,
    checkHasFailedPayment
  };
}
