import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UpgradeGateModal } from "./UpgradeGateModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpRight, Circle } from "lucide-react";

interface UsageProgressWidgetProps {
  projectCount: number;
  projectLimit: number;
  currentPlan?: "starter" | "growth" | "business" | "enterprise";
  className?: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter (Free)",
  growth: "Growth",
  business: "Business",
};

export function UsageProgressWidget({
  projectCount,
  projectLimit,
  currentPlan = "starter",
  className,
}: UsageProgressWidgetProps) {
  const [gateOpen, setGateOpen] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  const ratio = projectLimit > 0 ? projectCount / projectLimit : 0;
  const percentage = Math.min(ratio * 100, 100);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  if (projectCount <= 0 && projectLimit <= 0) return null;

  const remaining = Math.max(projectLimit - projectCount, 0);
  const isAtLimit = projectCount >= projectLimit;
  const isNear = ratio > 0.5 && !isAtLimit;
  const isWarning = ratio > 0.83;

  // Color logic: green 0-50%, yellow 51-83%, red 84-100%
  const progressColor = isAtLimit || isWarning
    ? "[&>div]:bg-destructive"
    : isNear
    ? "[&>div]:bg-yellow-500"
    : "[&>div]:bg-brand-green";

  const dotColor = isAtLimit || isWarning
    ? "text-destructive"
    : isNear
    ? "text-yellow-500"
    : "text-brand-green";

  const nextYear = new Date().getFullYear() + 1;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <p className="font-medium">{PLAN_LABELS[currentPlan] ?? currentPlan}</p>
      <p>{projectCount} of {projectLimit} projects used</p>
      <p>{remaining} remaining</p>
      <p className="text-muted-foreground">Resets January 1, {nextYear}</p>
    </div>
  );

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* === Desktop card === */}
            <div
              className={cn(
                "rounded-lg border border-border bg-card p-4 cursor-pointer transition-shadow hover:shadow-md",
                isAtLimit && "border-destructive/40 bg-destructive/5",
                className,
              )}
              role="button"
              tabIndex={0}
              onClick={() => setGateOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setGateOpen(true)}
            >
              {/* Mobile compact view */}
              <div className="flex items-center gap-2 sm:hidden">
                <Circle
                  className={cn("h-2.5 w-2.5 fill-current", dotColor, isAtLimit && "animate-pulse")}
                />
                <span className="text-sm font-semibold text-foreground">
                  {projectCount}/{projectLimit}
                </span>
                <span className="text-xs text-muted-foreground">projects</span>
                {isAtLimit && (
                  <Button size="sm" variant="default" className="ml-auto h-7 text-xs">
                    Upgrade
                  </Button>
                )}
              </div>

              {/* Desktop full view */}
              <div className="hidden sm:block space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">Projects This Year</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {PLAN_LABELS[currentPlan] ?? currentPlan}
                    </Badge>
                  </div>
                  {isAtLimit && (
                    <Circle className="h-2.5 w-2.5 fill-current text-destructive animate-pulse" />
                  )}
                </div>

                {/* Large number */}
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {projectCount} <span className="text-base font-normal text-muted-foreground">of {projectLimit} used</span>
                </p>

                {/* Animated progress bar */}
                <Progress
                  value={animatedValue}
                  className={cn("h-2 transition-all duration-700", progressColor)}
                />

                {/* Details row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {isAtLimit
                      ? "Limit reached"
                      : `${remaining} remaining`}
                  </span>
                  <span>Resets Jan 1, {nextYear}</span>
                </div>

                {/* Upgrade CTA when >50% or at limit */}
                {(isNear || isAtLimit) && (
                  <div className="flex items-center justify-between pt-1">
                    <p className={cn("text-xs", isAtLimit ? "text-destructive" : "text-muted-foreground")}>
                      {isAtLimit
                        ? "Upgrade to create more projects"
                        : "Running low — consider upgrading"}
                    </p>
                    <Button
                      size="sm"
                      variant={isAtLimit ? "default" : "outline"}
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGateOpen(true);
                      }}
                    >
                      Upgrade <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpgradeGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        currentLimit={projectLimit}
        currentPlan={currentPlan}
      />
    </>
  );
}
