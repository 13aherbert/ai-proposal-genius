import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { TierBadge } from "./TierBadge";
import { ChevronDown, ChevronUp, Lock, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTION_REQUIRED_TIER: Record<string, string | null> = {
  overview: null,
  analysis: null,
  proposal: null,
  review: "growth",
  design: "business",
};

const SECTION_LABELS: Record<string, string> = {
  review: "Review & Evaluation",
  design: "Design Studio",
};

export function ProjectTierIndicator() {
  const { plan, isLoading } = useSubscriptionFeatures();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return null;

  const TIER_ORDER: Record<string, number> = {
    starter: 0,
    growth: 1,
    business: 2,
    enterprise: 3,
  };

  const currentLevel = TIER_ORDER[plan] ?? 0;

  const lockedSections = Object.entries(SECTION_REQUIRED_TIER)
    .filter(([, tier]) => {
      if (!tier) return false;
      return currentLevel < (TIER_ORDER[tier] ?? 1);
    })
    .map(([id, tier]) => ({ id, tier: tier as string }));

  if (lockedSections.length === 0) return null;

  return (
    <div className="border-t border-border pt-4 mt-4 px-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BarChart3 className="h-3.5 w-3.5" />
        <span className="flex-1">
          Your Plan: <span className="font-medium capitalize text-foreground">{plan}</span>
        </span>
        <span className="text-xs">{lockedSections.length} locked</span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {lockedSections.map(({ id, tier }) => (
            <div
              key={id}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Lock className="h-3 w-3" />
              <span className="flex-1">
                {SECTION_LABELS[id] || id}
              </span>
              <TierBadge tier={tier as any} size="sm" />
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/subscription")}
            className="w-full mt-2 text-xs gap-1 h-7"
          >
            Upgrade <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
