
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Subscription() {
  const { data: subscription, isLoading } = useSubscription();
  const navigate = useNavigate();

  // Redirect if user already has an active subscription
  useEffect(() => {
    if (!isLoading && subscription?.subscribed) {
      navigate('/dashboard');
    }
  }, [subscription, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return <SubscriptionPlans />;
}
