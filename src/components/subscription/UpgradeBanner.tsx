
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { isTrialExpired } from "@/hooks/subscription/feature-access";

export function UpgradeBanner() {
  const { plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // Only show for trial plans that haven't expired yet
  if (plan !== 'trial' || !session?.user || isTrialExpired(session.user)) {
    return null;
  }
  
  const handleUpgradeClick = () => {
    toast.info("Redirecting to subscription options");
    navigate('/subscription', { state: { fromUpgradeButton: true } });
  };
  
  return (
    <div className="bg-black/30 backdrop-blur-sm border-brand-green border px-4 py-3 mb-4 rounded-lg flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0">
        <Crown className="h-5 w-5 text-yellow-400 mr-2" />
        <p className="text-white">
          You're on a free trial. Upgrade to unlock all features.
        </p>
      </div>
      <Button 
        onClick={handleUpgradeClick}
        className="bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
