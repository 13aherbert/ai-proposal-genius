
import { addDays, isPast } from 'date-fns';
import { SubscriptionPlan } from '@/types/subscription';

/**
 * Check if subscription is past grace period
 * @param subscription Current subscription data
 * @returns Boolean indicating if subscription is past grace period
 */
export const isPastGracePeriod = (subscription: SubscriptionPlan | null): boolean => {
  if (!subscription?.current_period_end) return false;
  
  const endDate = new Date(subscription.current_period_end);
  const gracePeriodEnd = addDays(endDate, 3);
  
  return isPast(endDate) && isPast(gracePeriodEnd);
};

/**
 * Check if subscription is in grace period
 * @param subscription Current subscription data
 * @returns Boolean indicating if subscription is in grace period
 */
export const isInGracePeriod = (subscription: SubscriptionPlan | null): boolean => {
  if (!subscription?.current_period_end) return false;
  
  const endDate = new Date(subscription.current_period_end);
  const gracePeriodEnd = addDays(endDate, 3);
  
  return isPast(endDate) && !isPast(gracePeriodEnd);
};

/**
 * Check if subscription is active (either actually active or in grace period)
 * @param subscription Current subscription data
 * @returns Boolean indicating if subscription is active
 */
export const isActive = (subscription: SubscriptionPlan | null): boolean => {
  return (
    subscription?.status === 'active' || 
    subscription?.status === 'trialing' || 
    isInGracePeriod(subscription)
  );
};

/**
 * Check if subscription has failed payment
 * @param subscription Current subscription data
 * @returns Boolean indicating if subscription has failed payment
 */
export const hasFailedPayment = (subscription: SubscriptionPlan | null): boolean => {
  return subscription?.status === 'past_due' || subscription?.status === 'unpaid';
};
