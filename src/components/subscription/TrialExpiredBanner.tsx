
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useAuth } from "@/components/AuthProvider";
import { isTrialExpired } from "@/hooks/subscription/feature-access";

export function TrialExpiredBanner() {
  const { plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // Only show for expired trial plans
  if (plan !== 'trial' || !session?.user || !isTrialExpired(session.user)) {
    return null;
  }
  
  const handleUpgradeClick = () => {
    navigate('/subscription', { state: { fromTrialExpired: true } });
  };
  
  return (
    <div className="bg-amber-50 border-amber-300 border mb-4 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
        <p className="text-amber-800">
          Your free trial has expired. Please upgrade to continue using all features.
        </p>
      </div>
      <Button 
        onClick={handleUpgradeClick}
        className="bg-amber-600 hover:bg-amber-700 text-white border-0"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
