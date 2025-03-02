
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { useSubscription } from "@/hooks/use-subscription";
import { Loader2, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Subscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: subscription, loading, isInGracePeriod, renewSubscription } = useSubscription();
  const [showRenewalPrompt, setShowRenewalPrompt] = useState(false);
  
  // Check if user is coming from a payment failure redirect
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Check URL parameters for payment status
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');
    const paymentIntent = queryParams.get('payment_intent');
    
    if (paymentStatus === 'failed' && paymentIntent) {
      setPaymentFailed(true);
      toast.error("Payment failed", {
        description: "We couldn't process your payment. Please try again with a different payment method."
      });
    }
    
    // Mark initial load as complete after subscription data is loaded or after a timeout
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 3000); // Set a reasonable timeout for loading

    return () => clearTimeout(timer);
  }, [location.search]);

  useEffect(() => {
    if (!loading && subscription) {
      setInitialLoadComplete(true);
      
      // Handle subscription renewal/update cases
      const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type !== 'trial';
      const hasFailedSubscriptionPayment = subscription?.status === 'past_due' || subscription?.status === 'unpaid';
      const needsRenewal = isInGracePeriod() || hasFailedSubscriptionPayment;
      
      if (hasActiveSubscription && !needsRenewal) {
        // Skip redirection to dashboard if the user explicitly came to the subscription page
        if (!location.state?.fromUpgradeButton) {
          navigate('/dashboard');
        }
      } else if (needsRenewal) {
        setShowRenewalPrompt(true);
      }
    }
  }, [subscription, loading, navigate, location.state, isInGracePeriod]);

  const handleUpdatePayment = () => {
    renewSubscription();
    toast.info("Payment update initiated", {
      description: "We're redirecting you to update your payment method"
    });
  };

  if (loading && !initialLoadComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
        <p className="text-muted-foreground">Loading your subscription...</p>
      </div>
    );
  }
  
  if (showRenewalPrompt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
          <div className="flex items-center text-amber-600 mb-4">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">Subscription Needs Attention</h2>
          </div>
          
          <p className="mb-4 text-muted-foreground">
            {isInGracePeriod() 
              ? "Your subscription has expired but is in the grace period. Renew now to avoid losing access."
              : "We couldn't process your last payment. Please update your payment method to continue your subscription."}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => renewSubscription()} 
              className="w-full"
            >
              Update Payment Method
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowRenewalPrompt(false)}
              className="w-full"
            >
              View Subscription Options
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-destructive/10 p-4 rounded-lg mb-8 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">Payment Failed</h3>
              <p className="text-sm">We couldn't process your payment. Please try again with a different payment method.</p>
            </div>
          </div>
          
          <div className="mb-8 flex justify-center">
            <Button 
              onClick={handleUpdatePayment}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </Button>
          </div>
          
          <SubscriptionPlans />
        </div>
      </div>
    );
  }

  // Add the Update Payment Method button to the standard view
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {subscription && subscription.status !== 'active' && (
          <div className="mb-8 flex justify-center">
            <Button 
              onClick={handleUpdatePayment}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </Button>
          </div>
        )}
        <SubscriptionPlans />
      </div>
    </div>
  );
}
