
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { useSubscription } from "@/hooks/use-subscription";

export default function Subscription() {
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();

  useEffect(() => {
    const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type !== 'trial';
    if (hasActiveSubscription) {
      navigate('/dashboard');
    }
  }, [subscription, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SubscriptionPlans />
    </div>
  );
}
