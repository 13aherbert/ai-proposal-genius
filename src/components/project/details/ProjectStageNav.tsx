import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";

export type StageId = "brief" | "analyze" | "draft" | "deliver";

interface Stage {
  id: StageId;
  label: string;
  description: string;
  requiredTier?: "growth" | "business";
}

const STAGES: Stage[] = [
  { id: "brief", label: "Brief", description: "RFP details" },
  { id: "analyze", label: "Analyze", description: "Requirements & outline" },
  { id: "draft", label: "Draft", description: "Write the proposal" },
  { id: "deliver", label: "Deliver", description: "Review, design & export", requiredTier: "growth" },
];

const TIER_ORDER: Record<string, number> = { starter: 0, growth: 1, business: 2, enterprise: 3 };

interface Props {
  activeStage: StageId;
  onChange: (stage: StageId) => void;
}

export function ProjectStageNav({ activeStage, onChange }: Props) {
  const { plan, isLoading } = useSubscriptionFeatures();
  const currentLevel = TIER_ORDER[plan] ?? 0;
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <nav className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-3">
          {STAGES.map((stage, idx) => {
            const isActive = stage.id === activeStage;
            const isComplete = idx < activeIndex;
            const locked =
              !isLoading && stage.requiredTier && currentLevel < (TIER_ORDER[stage.requiredTier] ?? 0);

            return (
              <li key={stage.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onChange(stage.id)}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                      isActive
                        ? "bg-background/20 text-background"
                        : isComplete
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground",
                    )}
                  >
                    {isComplete ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span className="font-medium">{stage.label}</span>
                  {locked && <Lock className="h-3 w-3 opacity-60" />}
                </button>
                {idx < STAGES.length - 1 && (
                  <span className="h-px w-4 sm:w-8 bg-border" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
