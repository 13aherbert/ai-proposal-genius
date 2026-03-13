import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UpgradeGateModal } from "./UpgradeGateModal";

interface UsageProgressWidgetProps {
  projectCount: number;
  projectLimit: number;
  currentPlan?: 'starter' | 'growth' | 'business';
  className?: string;
}

export function UsageProgressWidget({
  projectCount,
  projectLimit,
  currentPlan = 'starter',
  className,
}: UsageProgressWidgetProps) {
  const [gateOpen, setGateOpen] = useState(false);

  if (projectCount <= 0 && projectLimit <= 0) return null;

  const ratio = projectLimit > 0 ? projectCount / projectLimit : 0;
  const percentage = Math.min(ratio * 100, 100);
  const remaining = Math.max(projectLimit - projectCount, 0);

  const isAtLimit = projectCount >= projectLimit;
  const isNear = ratio >= 0.7 && !isAtLimit;

  const progressColor = isAtLimit
    ? "[&>div]:bg-destructive"
    : isNear
    ? "[&>div]:bg-yellow-500"
    : "";

  const textColor = isAtLimit
    ? "text-destructive"
    : isNear
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-muted-foreground";

  return (
    <>
      <div
        className={cn(
          "rounded-lg border border-border p-4 space-y-2 cursor-default",
          isAtLimit && "border-destructive/40 bg-destructive/5",
          className
        )}
        role="button"
        tabIndex={0}
        onClick={() => isAtLimit && setGateOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && isAtLimit && setGateOpen(true)}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {projectCount} of {projectLimit} projects used
          </span>
          <span className={cn("text-xs", textColor)}>
            {isAtLimit
              ? "Limit reached"
              : `${remaining} remaining`}
          </span>
        </div>

        <Progress value={percentage} className={cn("h-2", progressColor)} />

        {isNear && !isAtLimit && (
          <p className={cn("text-xs", textColor)}>
            Running low — consider{" "}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGateOpen(true);
              }}
              className="underline hover:text-foreground transition-colors font-medium"
            >
              upgrading
            </button>
          </p>
        )}

        {isAtLimit && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-destructive">
              Upgrade to create more projects
            </p>
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                setGateOpen(true);
              }}
            >
              Upgrade
            </Button>
          </div>
        )}
      </div>

      <UpgradeGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        currentLimit={projectLimit}
        currentPlan={currentPlan}
      />
    </>
  );
}
