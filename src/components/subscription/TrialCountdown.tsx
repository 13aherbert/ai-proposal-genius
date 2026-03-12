import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useAuth } from "@/components/AuthProvider";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface TrialCountdownProps {
  className?: string;
  variant?: "banner" | "compact" | "badge";
}

/**
 * UsageIndicator - Shows project usage for Free Plan users
 * Replaces the old time-based TrialCountdown with usage-based messaging.
 */
export function TrialCountdown({ className, variant = "banner" }: TrialCountdownProps) {
  const { plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const projectLimit = 3;

  // Only show for free/trial users
  const isFreePlan = !plan || plan === 'trial' || plan === 'starter';

  useEffect(() => {
    const fetchCount = async () => {
      if (!session?.user?.id || !organization?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const { count, error } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);
        if (!error) setProjectCount(count || 0);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchCount();
  }, [session?.user?.id, organization?.id]);

  if (!isFreePlan || !session?.user) return null;
  if (isLoading) return null;

  const count = projectCount ?? 0;
  const ratio = projectLimit > 0 ? count / projectLimit : 0;

  const getConfig = () => {
    if (ratio >= 0.9) {
      return {
        bgClass: "bg-destructive/10 border-destructive/30",
        textClass: "text-destructive",
        message: `${count} of ${projectLimit} projects used`,
        description: "You've nearly reached your limit. Upgrade for more projects.",
      };
    } else if (ratio >= 0.7) {
      return {
        bgClass: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
        textClass: "text-orange-800 dark:text-orange-200",
        message: `${count} of ${projectLimit} projects used`,
        description: "You're approaching your project limit.",
      };
    }
    return {
      bgClass: "bg-muted border-border",
      textClass: "text-muted-foreground",
      message: `Free Plan — ${count} of ${projectLimit} projects used`,
      description: "Upgrade anytime for more projects and features. See all plans.",
    };
  };

  const config = getConfig();

  const handleUpgradeClick = () => {
    navigate('/subscription', { state: { fromTrialCountdown: true } });
  };

  if (variant === "badge") {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", config.bgClass, config.textClass, className)}>
        {count}/{projectLimit} projects
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center justify-between gap-3 px-3 py-2 rounded-lg border", config.bgClass, className)}>
        <span className={cn("text-sm font-medium", config.textClass)}>{config.message}</span>
        <Button size="sm" variant="secondary" onClick={handleUpgradeClick} className="h-7 text-xs">
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border mb-4", config.bgClass, className)}>
      <div>
        <p className={cn("font-medium", config.textClass)}>{config.message}</p>
        <p className={cn("text-sm opacity-80", config.textClass)}>{config.description}</p>
      </div>
      <Button onClick={handleUpgradeClick} size="sm" variant="secondary" className="shrink-0">
        Upgrade
      </Button>
    </div>
  );
}
