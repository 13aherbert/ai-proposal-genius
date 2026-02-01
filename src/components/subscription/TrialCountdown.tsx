import { useAuth } from "@/components/AuthProvider";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { Clock, AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TrialCountdownProps {
  className?: string;
  variant?: "banner" | "compact" | "badge";
}

/**
 * TrialCountdown - Shows days remaining in trial with progressive messaging
 * 
 * Messaging stages:
 * - 7+ days: Gentle reminder (informational)
 * - 4-6 days: Moderate warning (yellow)
 * - 1-3 days: Urgent action needed (orange)
 * - 0 days / hours left: Critical (red)
 */
export function TrialCountdown({ className, variant = "banner" }: TrialCountdownProps) {
  const { session } = useAuth();
  const { plan } = useSubscriptionFeatures();
  const navigate = useNavigate();

  // Only show for trial users
  if (plan !== 'trial' || !session?.user) {
    return null;
  }

  // Calculate trial end date (14 days from account creation)
  const createdAt = new Date(session.user.created_at);
  const trialEndDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  const daysLeft = differenceInDays(trialEndDate, now);
  const hoursLeft = differenceInHours(trialEndDate, now);

  // Don't show if trial has expired (TrialExpiredBanner handles that)
  if (daysLeft < 0) {
    return null;
  }

  // Determine urgency level and styling
  const getUrgencyConfig = () => {
    if (daysLeft >= 7) {
      return {
        level: "info" as const,
        icon: Clock,
        bgClass: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        textClass: "text-blue-800 dark:text-blue-200",
        iconClass: "text-blue-600 dark:text-blue-400",
        message: `${daysLeft} days left in your free trial`,
        description: "Explore all Pro features before your trial ends.",
      };
    } else if (daysLeft >= 4) {
      return {
        level: "warning" as const,
        icon: AlertCircle,
        bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        textClass: "text-amber-800 dark:text-amber-200",
        iconClass: "text-amber-600 dark:text-amber-400",
        message: `${daysLeft} days left in your trial`,
        description: "Upgrade now to keep access to Pro features.",
      };
    } else if (daysLeft >= 1) {
      return {
        level: "urgent" as const,
        icon: AlertTriangle,
        bgClass: "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700",
        textClass: "text-orange-800 dark:text-orange-200",
        iconClass: "text-orange-600 dark:text-orange-400",
        message: `Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!`,
        description: "Don't lose your Pro features - upgrade today.",
      };
    } else {
      // Less than 24 hours
      return {
        level: "critical" as const,
        icon: XCircle,
        bgClass: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700",
        textClass: "text-red-800 dark:text-red-200",
        iconClass: "text-red-600 dark:text-red-400",
        message: hoursLeft > 0 ? `${hoursLeft} hours left!` : "Trial ending soon!",
        description: "Your trial expires today. Upgrade to continue.",
      };
    }
  };

  const config = getUrgencyConfig();
  const Icon = config.icon;

  const handleUpgradeClick = () => {
    navigate('/subscription', { state: { fromTrialCountdown: true } });
  };

  // Badge variant - minimal, just shows days
  if (variant === "badge") {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          config.bgClass,
          config.textClass,
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {daysLeft > 0 ? `${daysLeft}d left` : `${hoursLeft}h left`}
      </span>
    );
  }

  // Compact variant - single line with button
  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border",
          config.bgClass,
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.iconClass)} />
          <span className={cn("text-sm font-medium", config.textClass)}>
            {config.message}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleUpgradeClick}
          className="h-7 text-xs"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  // Banner variant - full width with description
  return (
    <div 
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border mb-4",
        config.bgClass,
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 sm:mt-0 flex-shrink-0", config.iconClass)} />
        <div>
          <p className={cn("font-medium", config.textClass)}>
            {config.message}
          </p>
          <p className={cn("text-sm opacity-80", config.textClass)}>
            {config.description}
            {daysLeft > 0 && (
              <span className="ml-1 opacity-60">
                Trial ends {format(trialEndDate, "MMM d, yyyy")}
              </span>
            )}
          </p>
        </div>
      </div>
      <Button 
        onClick={handleUpgradeClick}
        className={cn(
          "shrink-0",
          config.level === "info" && "bg-blue-600 hover:bg-blue-700",
          config.level === "warning" && "bg-amber-600 hover:bg-amber-700",
          config.level === "urgent" && "bg-orange-600 hover:bg-orange-700",
          config.level === "critical" && "bg-red-600 hover:bg-red-700"
        )}
      >
        Upgrade Now
      </Button>
    </div>
  );
}
