
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export function UpgradeBanner() {
  const { plan } = useSubscriptionFeatures();
  const navigate = useNavigate();
  
  // Only show for trial or starter plans
  if (plan !== 'trial' && plan !== 'starter') {
    return null;
  }
  
  return (
    <div className="bg-black/30 backdrop-blur-sm border-brand-green border px-4 py-3 mb-4 rounded-lg flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0">
        <Crown className="h-5 w-5 text-yellow-400 mr-2" />
        <p className="text-white">
          {plan === 'trial' 
            ? "You're on a free trial. Upgrade to unlock all features." 
            : "Upgrade to Pro for advanced features like compiled drafts and AI evaluation."}
        </p>
      </div>
      <Button 
        onClick={() => navigate('/subscription')}
        className="bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
