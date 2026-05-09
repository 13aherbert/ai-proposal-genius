
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText, FileEdit, Wand, Palette, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionFeatures, FeatureName } from "@/hooks/use-subscription-features";
import { useSubscription } from "@/hooks/use-subscription";
import { TierBadge } from "@/components/subscription/TierBadge";
import { ProjectTierIndicator } from "@/components/subscription/ProjectTierIndicator";
import { FeatureDiscoveryTooltip } from "@/components/subscription/FeatureDiscoveryTooltip";

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const TIER_ORDER: Record<string, number> = {
  starter: 0,
  growth: 1,
  business: 2,
  enterprise: 3,
};

type RequiredTier = 'growth' | 'business' | 'enterprise';

const SECTION_REQUIRED_TIER: Record<string, RequiredTier | null> = {
  overview: null,
  analysis: null,
  proposal: null,
  review: 'growth',
  design: 'business',
};

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const { hasFeature, plan, isLoading } = useSubscriptionFeatures();

  const sections = [
    {
      id: "overview",
      label: "Overview",
      icon: FileText,
      feature: null,
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: ScrollText,
      feature: "rfp_summary" as FeatureName,
    },
    {
      id: "proposal",
      label: "Proposal",
      icon: FileEdit,
      feature: "proposal_draft" as FeatureName,
    },
    {
      id: "review",
      label: "Review",
      icon: CheckSquare,
      feature: "evaluation" as FeatureName,
    },
    {
      id: "design",
      label: "Design",
      icon: Palette,
      feature: "design_studio" as FeatureName,
    },
  ] as const;

  const isFeatureLocked = (sectionId: string): boolean => {
    if (isLoading) return false;
    const requiredTier = SECTION_REQUIRED_TIER[sectionId];
    if (!requiredTier) return false;
    const currentLevel = TIER_ORDER[plan] ?? 0;
    const requiredLevel = TIER_ORDER[requiredTier] ?? 1;
    return currentLevel < requiredLevel;
  };

  // Always allow navigation — the content area will show the upgrade prompt
  const handleSectionChange = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  // Prefetch lazy chunks on hover for faster section switching
  const prefetchSection = (sectionId: string) => {
    switch (sectionId) {
      case "analysis":
        import("@/components/project/unified-analysis/UnifiedAnalysisView");
        import("@/components/project/RFPAnalysis");
        import("@/components/project/proposal-outline/ProposalOutline");
        break;
      case "proposal":
        import("@/components/project/unified-proposal/UnifiedProposalView");
        import("@/components/project/proposal-draft/ProposalDraft");
        break;
      case "review":
        import("@/components/project/review/ReviewQueue");
        import("@/components/project/proposal-evaluation/ProposalEvaluation");
        break;
      case "design":
        import("@/components/project/design-studio/ProposalDesignStudio");
        break;
    }
  };

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden border-b bg-background overflow-x-auto sticky top-0 z-10">
        <div className="flex min-w-max px-2 py-2 gap-1">
          {sections.map((section) => {
            const locked = isFeatureLocked(section.id);
            const requiredTier = SECTION_REQUIRED_TIER[section.id];
            
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 whitespace-nowrap text-xs",
                  locked && "opacity-70"
                )}
                onClick={() => handleSectionChange(section.id)}
                onMouseEnter={() => prefetchSection(section.id)}
                onFocus={() => prefetchSection(section.id)}
              >
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:block w-64 border-r bg-background p-4 space-y-2">
        {sections.map((section) => {
          const locked = isFeatureLocked(section.id);
          const requiredTier = SECTION_REQUIRED_TIER[section.id];

          const button = (
            <Button
              key={section.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 hover:bg-brand-green hover:text-white",
                activeSection === section.id && "bg-muted",
                locked && "opacity-70"
              )}
              onClick={() => handleSectionChange(section.id)}
            >
              <section.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{section.label}</span>
              {locked && requiredTier && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          );

          if (section.id === "review" && locked) {
            return (
              <FeatureDiscoveryTooltip
                key={section.id}
                featureId="review-tab"
                message="💡 Growth plan unlocks Review workflows for team-based proposal review."
              >
                {button}
              </FeatureDiscoveryTooltip>
            );
          }

          return button;
        })}

        <ProjectTierIndicator />
      </div>
    </>
  );
}
