import { type ReactNode } from "react";
import { Lock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "./TierBadge";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useNavigate } from "react-router-dom";

type RequiredTier = 'growth' | 'business' | 'enterprise';

const TIER_ORDER: Record<string, number> = {
  starter: 0,
  growth: 1,
  business: 2,
  enterprise: 3,
};

const TIER_PRICING: Record<RequiredTier, string> = {
  growth: "$199/month",
  business: "$499/month",
  enterprise: "Custom pricing",
};

const TIER_DISPLAY: Record<RequiredTier, string> = {
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

interface GatedFeatureProps {
  featureName: string;
  requiredTier: RequiredTier;
  description: string;
  benefits: string[];
  children: ReactNode;
}

export function GatedFeature({
  featureName,
  requiredTier,
  description,
  benefits,
  children,
}: GatedFeatureProps) {
  const { plan, isLoading } = useSubscriptionFeatures();
  const navigate = useNavigate();

  // While loading, show skeleton — don't lock out
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentTierLevel = TIER_ORDER[plan] ?? 0;
  const requiredTierLevel = TIER_ORDER[requiredTier] ?? 1;

  // If user has access, render children
  if (currentTierLevel >= requiredTierLevel) {
    return <>{children}</>;
  }

  // Tier data failed to load (plan is somehow empty) — don't lock out
  if (!plan) {
    return <>{children}</>;
  }

  const tierDisplay = TIER_DISPLAY[requiredTier];
  const pricing = TIER_PRICING[requiredTier];

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="w-full max-w-lg text-center space-y-6 py-12">
        {/* Lock icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Unlock {featureName}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Benefits */}
        <ul className="text-left space-y-3 max-w-sm mx-auto">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-brand-green" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Tier badge */}
        <div className="flex justify-center">
          <TierBadge tier={requiredTier} />
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            size="lg"
            onClick={() => navigate('/subscription')}
            className="w-full max-w-xs"
          >
            Upgrade to {tierDisplay} — {pricing}
          </Button>
          <div>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/subscription')}
              className="text-muted-foreground hover:text-foreground"
            >
              Compare All Plans <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Encouragement */}
        <p className="text-xs text-muted-foreground">
          You're on {plan.charAt(0).toUpperCase() + plan.slice(1)} — upgrade to unlock even more power
        </p>
      </div>
    </div>
  );
}
