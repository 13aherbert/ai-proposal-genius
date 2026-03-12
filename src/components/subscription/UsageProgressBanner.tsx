
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useAuth } from "@/components/AuthProvider";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  starter: "Free Plan",
  trial: "Free Plan",
  basic: "Basic Plan",
  pro: "Pro Plan",
};

export function UsageProgressBanner() {
  const { plan, getProjectLimit, isLoading: featuresLoading } = useSubscriptionFeatures();
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const projectLimit = getProjectLimit();

  useEffect(() => {
    const fetchCount = async () => {
      if (!session?.user?.id || !organization?.id) {
        setLoading(false);
        return;
      }
      try {
        const { count, error } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization.id);
        if (!error) setProjectCount(count || 0);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, [session?.user?.id, organization?.id]);

  if (loading || featuresLoading || projectCount === null) return null;

  // Hide for pro users not near limit
  const count = projectCount;
  const percentage = projectLimit > 0 ? Math.min((count / projectLimit) * 100, 100) : 0;
  const isNearLimit = percentage >= 70;
  const isAtLimit = count >= projectLimit;

  // Don't show banner if pro plan and under 70%
  if (plan === "pro" && !isNearLimit) return null;

  const planName = PLAN_DISPLAY_NAMES[plan] || "Free Plan";

  const progressColor =
    percentage > 90
      ? "bg-destructive"
      : percentage > 70
        ? "bg-orange-500"
        : "bg-brand-green";

  const handleUpgrade = () => {
    navigate("/subscription", { state: { fromUpgradeButton: true } });
  };

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 mb-4">
      {isAtLimit ? (
        {/* At-limit urgent state */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-destructive font-medium text-center sm:text-left">
            You've reached your {projectLimit}-project limit. Upgrade to{" "}
            {plan === "starter" || plan === "trial" ? "Basic for 10" : "Pro for 30"} projects.
          </div>
          <Button size="sm" onClick={handleUpgrade} className="shrink-0">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Upgrade Now
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Left: plan + usage text */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs font-medium">
              {planName}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {count} of {projectLimit} projects used
            </span>
            <span className="text-sm text-muted-foreground sm:hidden">
              {count}/{projectLimit} projects
            </span>
          </div>

          {/* Center: progress bar */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Right: upgrade CTA when near limit */}
          {isNearLimit && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpgrade}
              className="shrink-0"
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
