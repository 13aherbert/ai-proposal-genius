
import { useEffect, useState } from 'react';
import { useSubscription } from './use-subscription';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isPast, differenceInDays } from 'date-fns';

export function useSubscriptionNotifications() {
  const subscription = useSubscription();
  const [hasShownGracePeriodNotice, setHasShownGracePeriodNotice] = useState(false);
  const [hasShownExpirationNotice, setHasShownExpirationNotice] = useState(false);
  const [hasShownRenewalNotice, setHasShownRenewalNotice] = useState(false);
  const [hasShownFailedPaymentNotice, setHasShownFailedPaymentNotice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (subscription.isLoading || !subscription.subscription) return;

    // Check for failed payment status
    if (
      !hasShownFailedPaymentNotice &&
      subscription.hasFailedPayment()
    ) {
      toast.error("Payment failed", {
        description: "We couldn't process your last payment. Please update your payment method.",
        duration: 10000,
        action: {
          label: "Update payment",
          onClick: () => navigate('/account-settings')
        }
      });
      setHasShownFailedPaymentNotice(true);
    }

    // Check for upcoming renewal (7 days before expiration)
    if (
      subscription.subscription.status === 'active' && 
      subscription.subscription.current_period_end && 
      !hasShownRenewalNotice
    ) {
      const endDate = new Date(subscription.subscription.current_period_end);
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
      subscription.subscription.current_period_end && 
      isPast(new Date(subscription.subscription.current_period_end)) && 
      !hasShownGracePeriodNotice
    ) {
      const gracePeriodEnd = addDays(new Date(subscription.subscription.current_period_end), 3);
      
      if (!isPast(gracePeriodEnd)) {
        const daysLeft = differenceInDays(gracePeriodEnd, new Date()) + 1;
        
        toast.warning(`Grace period: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`, {
          description: "Your subscription has expired. Update your payment method to maintain access.",
          duration: 0,
          action: {
            label: "Renew now",
            onClick: () => navigate('/subscription')
          }
        });
        
        setHasShownGracePeriodNotice(true);
      } else if (!hasShownExpirationNotice) {
        toast.error("Subscription expired", {
          description: "Your subscription has expired and the grace period has ended. Renew now to restore access.",
          duration: 0,
          action: {
            label: "Renew now",
            onClick: () => navigate('/subscription')
          }
        });
        
        setHasShownExpirationNotice(true);
      }
    }
  }, [
    subscription.subscription, 
    subscription.isLoading, 
    navigate, 
    hasShownGracePeriodNotice, 
    hasShownExpirationNotice, 
    hasShownRenewalNotice,
    hasShownFailedPaymentNotice,
  ]);

  return { 
    isInGracePeriod: subscription.isInGracePeriod,
    hasFailedPayment: subscription.hasFailedPayment
  };
}
