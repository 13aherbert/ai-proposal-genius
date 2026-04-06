import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useAuth } from "@/components/AuthProvider";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "./TierBadge";

const DISMISS_KEY = "optirfp_upgrade_banner_dismissed_at";
const REAPPEAR_DAYS = 7;

function isDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const dismissed = parseInt(ts, 10);
    const elapsed = Date.now() - dismissed;
    return elapsed < REAPPEAR_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function DashboardUpgradeBanner() {
  const { plan, isLoading } = useSubscriptionFeatures();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(isDismissed);

  if (isLoading || hidden || !session?.user) return null;

  const isFreePlan = !plan || plan === "starter" || plan === "trial";
  if (!isFreePlan) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setHidden(true);
  };

  return (
    <div className="relative rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 p-4 sm:p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pr-8">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <TierBadge tier="starter" size="sm" />
          <span className="text-sm font-medium text-foreground">
            You're on the Free Starter plan
          </span>
        </div>

        <p className="text-sm text-muted-foreground flex-1">
          Unlock export, review workflows, integrations &amp; more
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/subscription")}
          className="shrink-0 gap-1.5"
        >
          See Plans <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
