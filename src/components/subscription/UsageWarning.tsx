import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlanComparisonModal } from "./PlanComparisonModal";

interface UsageWarningProps {
  projectCount: number;
  projectLimit: number;
  className?: string;
}

export function UsageWarning({ projectCount, projectLimit, className }: UsageWarningProps) {
  const [showComparison, setShowComparison] = useState(false);
  const remaining = projectLimit - projectCount;
  const ratio = projectLimit > 0 ? projectCount / projectLimit : 0;

  if (projectCount <= 0) return null;

  let message: string;
  let colorClass: string;
  let showUpgrade = false;

  if (ratio >= 1) {
    message = `You've used all ${projectLimit} projects`;
    colorClass = "text-destructive";
    showUpgrade = true;
  } else if (ratio >= 0.7) {
    message = `${remaining} project${remaining !== 1 ? "s" : ""} remaining — consider upgrading`;
    colorClass = "text-orange-500 dark:text-orange-400";
    showUpgrade = true;
  } else {
    message = `${remaining} project${remaining !== 1 ? "s" : ""} remaining on Free Plan`;
    colorClass = "text-muted-foreground";
  }

  return (
    <>
      <p className={cn("text-sm", colorClass, className)}>
        {message}
        {showUpgrade && (
          <>
            {" — "}
            <button
              onClick={() => setShowComparison(true)}
              className="underline hover:text-foreground transition-colors font-medium"
            >
              upgrade for more
            </button>
          </>
        )}
      </p>
      <PlanComparisonModal open={showComparison} onOpenChange={setShowComparison} />
    </>
  );
}
