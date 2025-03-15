/**
 * Subscription Page Component
 * 
 * Handles displaying and managing user subscription states:
 * - Loading state while subscription data is fetched
 * - Renewal prompt if subscription needs attention
 * - Payment failed view if a payment attempt failed
 * - Default subscription plans view
 * 
 * Handles routing logic based on subscription status and manages
 * payment update process.
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { LoadingState } from "@/components/subscription/LoadingState";
import { RenewalPrompt } from "@/components/subscription/RenewalPrompt";
import { PaymentFailedView } from "@/components/subscription/PaymentFailedView";
import { DefaultView } from "@/components/subscription/DefaultView";
import { usePaymentUpdate } from "@/hooks/subscription/use-payment-update";

export default function Subscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = useSubscription();
  const { handleUpdatePayment, isUpdatingPayment } = usePaymentUpdate();
  const [showRenewalPrompt, setShowRenewalPrompt] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Check for payment status in URL params (redirected from payment provider)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');
    const paymentIntent = queryParams.get('payment_intent');
    
    if (paymentStatus === 'failed' && paymentIntent) {
      setPaymentFailed(true);
      toast.error("Payment failed", {
        description: "We couldn't process your payment. Please try again with a different payment method."
      });
    }
    
    // Set initialLoadComplete after a timeout to prevent flickering
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.search]);

  // Process subscription data once loaded
  useEffect(() => {
    if (!subscription.isLoading && subscription.subscription) {
      setInitialLoadComplete(true);
      
      const hasActiveSubscription = subscription.subscription?.status === 'active' && subscription.subscription?.plan_type !== 'trial';
      const hasFailedSubscriptionPayment = subscription.subscription?.status === 'past_due' || subscription.subscription?.status === 'unpaid';
      // Fix: Call isInGracePeriod as a function without arguments
      const needsRenewal = subscription.isInGracePeriod() || hasFailedSubscriptionPayment;
      
      if (hasActiveSubscription && !needsRenewal) {
        if (!location.state?.fromUpgradeButton) {
          navigate('/dashboard');
        }
      } else if (needsRenewal) {
        setShowRenewalPrompt(true);
      }
    }
  }, [subscription.subscription, subscription.isLoading, navigate, location.state, subscription.isInGracePeriod]);

  // Render appropriate view based on state
  if (subscription.isLoading && !initialLoadComplete) {
    return <LoadingState />;
  }
  
  if (showRenewalPrompt) {
    return (
      <RenewalPrompt
        // Fix: Call isInGracePeriod as a function
        isInGracePeriod={subscription.isInGracePeriod()}
        handleUpdatePayment={handleUpdatePayment}
        isUpdatingPayment={isUpdatingPayment}
        setShowRenewalPrompt={setShowRenewalPrompt}
      />
    );
  }

  if (paymentFailed) {
    return (
      <PaymentFailedView
        handleUpdatePayment={handleUpdatePayment}
        isUpdatingPayment={isUpdatingPayment}
      />
    );
  }

  return (
    <DefaultView
      handleUpdatePayment={handleUpdatePayment}
      isUpdatingPayment={isUpdatingPayment}
    />
  );
}
