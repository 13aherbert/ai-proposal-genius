
/**
 * Subscription Page Component
 * 
 * In-app pricing & plan management page for logged-in users.
 * Shows current plan, plan cards, and feature comparison table.
 * Handles renewal prompts and payment failures.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/subscription";
import { toast } from "sonner";
import { useSEO } from "@/hooks/use-seo";
import { LoadingState } from "@/components/subscription/LoadingState";
import { RenewalPrompt } from "@/components/subscription/RenewalPrompt";
import { PaymentFailedView } from "@/components/subscription/PaymentFailedView";
import { DefaultView } from "@/components/subscription/DefaultView";
import { usePaymentUpdate } from "@/hooks/subscription/use-payment-update";

export default function Subscription() {
  const location = useLocation();
  const subscription = useSubscription();
  const { handleUpdatePayment, isUpdatingPayment } = usePaymentUpdate();
  const [showRenewalPrompt, setShowRenewalPrompt] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useSEO({
    title: "Plans & Pricing — OptiRFP",
    description: "Choose the right OptiRFP plan. Start free with 6 projects. Scale to Growth ($199), Business ($499), or Enterprise ($1,499+).",
  });

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
    
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.search]);

  // Process subscription data — show renewal prompt if needed but NEVER redirect away
  useEffect(() => {
    if (!subscription.isLoading && subscription.subscription) {
      setInitialLoadComplete(true);
      
      const hasFailedSubscriptionPayment = subscription.subscription?.status === 'past_due' || subscription.subscription?.status === 'unpaid';
      const needsRenewal = subscription.isInGracePeriod() || hasFailedSubscriptionPayment;
      
      if (needsRenewal) {
        setShowRenewalPrompt(true);
      }
    }
  }, [subscription.subscription, subscription.isLoading, subscription.isInGracePeriod]);

  if (subscription.isLoading && !initialLoadComplete) {
    return <LoadingState />;
  }
  
  if (showRenewalPrompt) {
    return (
      <RenewalPrompt
        isInGracePeriod={subscription.isInGracePeriod}
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
      hasStripeCustomer={!!subscription.data?.stripe_customer_id}
    />
  );
}
