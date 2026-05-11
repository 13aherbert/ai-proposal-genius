import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TierType = 'starter' | 'growth' | 'business' | 'enterprise';

const TIER_STYLES: Record<TierType, string> = {
  starter: "bg-muted text-muted-foreground border-border",
  growth: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
  business: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  enterprise: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
};

const TIER_LABELS: Record<TierType, string> = {
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

interface TierBadgeProps {
  // Accept any string so legacy values like 'pro'/'basic' from old data don't break callers
  tier: TierType | string;
  className?: string;
  size?: 'sm' | 'default';
}

// Map any legacy slug to a canonical tier
function normalize(tier: string): TierType {
  switch (tier) {
    case 'pro':
    case 'basic':
      return 'business';
    case 'trial':
      return 'starter';
    case 'starter':
    case 'growth':
    case 'business':
    case 'enterprise':
      return tier;
    default:
      return 'starter';
  }
}

export function TierBadge({ tier, className, size = 'default' }: TierBadgeProps) {
  const normalized = normalize(tier);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        size === 'sm' ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        TIER_STYLES[normalized],
        className
      )}
    >
      {TIER_LABELS[normalized]}
    </Badge>
  );
}
