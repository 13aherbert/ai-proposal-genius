
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { isTrialExpired } from "@/hooks/subscription/feature-access";

export function TrialExpiredBanner() {
  const { plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    // Check if user is on trial plan
    if (plan !== 'trial' || !session?.user) {
      setShouldShow(false);
      return;
    }

    // Only show the banner if the trial has expired
    const expired = isTrialExpired(session.user);
    setShouldShow(expired);
    
    // Save the trial expiry status in localStorage to avoid recalculating too often
    if (expired) {
      try {
        localStorage.setItem('trialExpired', 'true');
      } catch (e) {
        console.error("Error storing trial expiry status:", e);
      }
    }
  }, [plan, session]);
  
  // Don't render anything if we shouldn't show the banner
  if (!shouldShow) {
    return null;
  }
  
  const handleUpgradeClick = () => {
    toast.info("Redirecting to subscription options");
    navigate('/subscription', { state: { fromTrialExpired: true } });
  };
  
  return (
    <div className="bg-amber-50 border-amber-400 border px-4 py-3 mb-4 rounded-lg flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0">
        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
        <div>
          <p className="text-amber-800 font-medium">
            Your free trial has expired
          </p>
          <p className="text-amber-700 text-sm">
            Upgrade now to keep access to all features and continue working on your projects.
          </p>
        </div>
      </div>
      <Button 
        onClick={handleUpgradeClick}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
