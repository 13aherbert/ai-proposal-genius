
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface CurrentPlanBadgeProps {
  isCurrentPlan: boolean;
  renewalDate?: string | null;
}

/**
 * CurrentPlanBadge - Visual indicator for current subscription plan
 * Shows a ribbon/badge when viewing the user's current plan
 */
export function CurrentPlanBadge({ isCurrentPlan, renewalDate }: CurrentPlanBadgeProps) {
  if (!isCurrentPlan) return null;

  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
      <Badge 
        className="bg-green-600 hover:bg-green-600 text-white px-4 py-1 text-sm font-medium shadow-lg"
      >
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Your Current Plan
      </Badge>
    </div>
  );
}
