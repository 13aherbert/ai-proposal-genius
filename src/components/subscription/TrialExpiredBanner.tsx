import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useAuth } from "@/components/AuthProvider";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function TrialExpiredBanner() {
  const { plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const navigate = useNavigate();
  const [isAtLimit, setIsAtLimit] = useState(false);

  const isFreePlan = !plan || plan === 'trial' || plan === 'starter';
  const projectLimit = 6;

  useEffect(() => {
    const checkLimit = async () => {
      if (!session?.user?.id || !organization?.id || !isFreePlan) return;
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      setIsAtLimit((count || 0) >= projectLimit);
    };
    checkLimit();
  }, [session?.user?.id, organization?.id, isFreePlan]);

  if (!isFreePlan || !session?.user || !isAtLimit) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border mb-4 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center mb-2 sm:mb-0">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
        <p className="text-amber-800 dark:text-amber-200">
          You've reached your project limit ({projectLimit} projects). Upgrade to create more.
        </p>
      </div>
      <Button
        onClick={() => navigate('/subscription', { state: { fromTrialExpired: true } })}
        className="bg-amber-600 hover:bg-amber-700 text-white border-0"
      >
        Upgrade Now
      </Button>
    </div>
  );
}
