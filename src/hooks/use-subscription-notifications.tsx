
import { useEffect, useState } from 'react';
import { useSubscription } from './use-subscription';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isPast, differenceInDays } from 'date-fns';

export function useSubscriptionNotifications() {
  const { data: subscription, loading, hasFailedPayment, isInGracePeriod } = useSubscription();
  const [hasShownGracePeriodNotice, setHasShownGracePeriodNotice] = useState(false);
  const [hasShownExpirationNotice, setHasShownExpirationNotice] = useState(false);
  const [hasShownRenewalNotice, setHasShownRenewalNotice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !subscription) return;

    // Check for failed payment status
    if (hasFailedPayment()) {
      toast.error("Payment failed", {
        description: "We couldn't process your last payment. Please update your payment method.",
        duration: 10000,
        action: {
          label: "Update payment",
          onClick: () => navigate('/account-settings')
        }
      });
    }

    // Check for upcoming renewal (7 days before expiration)
    if (
      subscription.status === 'active' && 
      subscription.current_period_end && 
      !hasShownRenewalNotice
    ) {
      const endDate = new Date(subscription.current_period_end);
      const daysUntilRenewal = differenceInDays(endDate, new Date());
      
      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
        toast.info("Subscription renewal", {
          description: `Your subscription will renew on ${format(endDate, 'MMMM dd, yyyy')}`,
          duration: 8000,
        });
        setHasShownRenewalNotice(true);
      }
    }

    // Check for grace period (subscription ended but within 3 days)
    if (
      subscription.current_period_end && 
      isPast(new Date(subscription.current_period_end)) && 
      !hasShownGracePeriodNotice
    ) {
      const gracePeriodEnd = addDays(new Date(subscription.current_period_end), 3);
      
      if (!isPast(gracePeriodEnd)) {
        // User is in grace period
        const daysLeft = differenceInDays(gracePeriodEnd, new Date()) + 1;
        
        toast.warning(`Grace period: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`, {
          description: "Your subscription has expired. Update your payment method to maintain access.",
          duration: 0, // This won't auto-dismiss
          action: {
            label: "Renew now",
            onClick: () => navigate('/subscription')
          }
        });
        
        setHasShownGracePeriodNotice(true);
      } else if (!hasShownExpirationNotice) {
        // Past grace period
        toast.error("Subscription expired", {
          description: "Your subscription has expired and the grace period has ended. Renew now to restore access.",
          duration: 0, // This won't auto-dismiss
          action: {
            label: "Renew now",
            onClick: () => navigate('/subscription')
          }
        });
        
        setHasShownExpirationNotice(true);
      }
    }
  }, [
    subscription, 
    loading, 
    navigate, 
    hasShownGracePeriodNotice, 
    hasShownExpirationNotice, 
    hasShownRenewalNotice,
    hasFailedPayment,
    isInGracePeriod
  ]);

  return { 
    isInGracePeriod,
    hasFailedPayment
  };
}
