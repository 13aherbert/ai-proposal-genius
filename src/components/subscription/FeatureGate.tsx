import { useState, type ReactNode } from "react";
import { Lock, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionFeatures, type FeatureName } from "@/hooks/use-subscription-features";
import { PlanComparisonModal } from "./PlanComparisonModal";

interface FeatureGateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  cta: string;
  roi?: string;
}

const FEATURE_GATE_CONFIG: Partial<Record<FeatureName, FeatureGateConfig>> = {
  team_collaboration: {
    icon: Users,
    title: "Invite Your Team",
    description: "Collaborate with unlimited team members on proposals",
    status: "Free plan: 1 user only",
    cta: "Upgrade to Growth — $199/month for unlimited users",
    roi: "Less than $17/user for a 12-person team",
  },
};

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  label?: string;
}

export function FeatureGate({ feature, children, label }: FeatureGateProps) {
  const { hasFeature, getPlanName } = useSubscriptionFeatures();
  const [showComparison, setShowComparison] = useState(false);

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const config = FEATURE_GATE_CONFIG[feature];

  if (config) {
    const Icon = config.icon;
    return (
      <>
        <div className="relative rounded-lg overflow-hidden">
          <div className="pointer-events-none select-none blur-[2px] opacity-60">
            {children}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-lg p-6 text-center">
            <Icon className="h-7 w-7 text-muted-foreground mb-3" />
            <p className="text-base font-semibold text-foreground mb-1">
              {config.title}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              {config.description}
            </p>
            <p className="text-xs text-muted-foreground/80 mb-3">
              {config.status}
            </p>
            <Button
              size="sm"
              onClick={() => setShowComparison(true)}
            >
              {config.cta}
            </Button>
            {config.roi && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {config.roi}
              </p>
            )}
          </div>
        </div>
        <PlanComparisonModal open={showComparison} onOpenChange={setShowComparison} />
      </>
    );
  }

  const planLabel = label || getPlanName(feature);

  return (
    <>
      <div className="relative rounded-lg overflow-hidden">
        <div className="pointer-events-none select-none blur-[2px] opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
          <Lock className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">
            {planLabel} Feature
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowComparison(true)}
          >
            Upgrade to unlock
          </Button>
        </div>
      </div>
      <PlanComparisonModal open={showComparison} onOpenChange={setShowComparison} />
    </>
  );
}
