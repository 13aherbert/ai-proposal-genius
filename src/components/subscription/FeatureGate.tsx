import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionFeatures, type FeatureName } from "@/hooks/use-subscription-features";
import { PlanComparisonModal } from "./PlanComparisonModal";

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
