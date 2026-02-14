
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText, FileEdit, Wand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionFeatures, FeatureName } from "@/hooks/use-subscription-features";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";


interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const { hasFeature, plan, isLoading, enableTestMode, isTestMode } = useSubscriptionFeatures();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const sections = [
    {
      id: "overview",
      label: "Overview",
      icon: FileText,
      feature: null,
      description: "Project details and prerequisites",
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: ScrollText,
      feature: "rfp_summary" as FeatureName,
      description: "RFP summary and proposal outline",
    },
    {
      id: "proposal",
      label: "Proposal",
      icon: FileEdit,
      feature: "proposal_draft" as FeatureName,
      description: "Draft, compiled, and auto-generated content",
    },
    {
      id: "review",
      label: "Review",
      icon: CheckSquare,
      feature: "evaluation" as FeatureName,
      description: "Evaluation and scoring",
    },
  ] as const;


  const handleDevModeToggle = () => {
    if (process.env.NODE_ENV === 'development') {
      if (isTestMode) {
        toast.info("Test mode disabled");
      } else {
        enableTestMode('starter');
        toast.info("Test mode enabled with starter plan");
      }
    }
  };

  const handleSectionChange = (sectionId: string, feature: FeatureName | null) => {
    if (!feature || hasFeature(feature)) {
      onSectionChange(sectionId);
    } else {
      if (isLoading || subscriptionLoading) {
        toast.loading("Checking your subscription status...");
        return;
      }
      
      const requiredPlan = 
        feature === "compiled_draft" || feature === "evaluation" 
          ? "Professional" 
          : "Starter";
      
      toast.error(
        `This feature is only available in the ${requiredPlan} plan`,
        {
          description: `Your current plan: ${plan || 'Trial'}`,
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/subscription"
          }
        }
      );
    }
  };

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden border-b bg-background overflow-x-auto sticky top-0 z-10">
        <div className="flex min-w-max px-2 py-2 gap-1">
          {sections.map((section) => {
            const isFeatureAvailable = 
              !section.feature || 
              (isLoading ? true : hasFeature(section.feature));
            
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-1.5 whitespace-nowrap text-xs",
                  section.feature && !isFeatureAvailable && "opacity-50"
                )}
                onClick={() => handleSectionChange(section.id, section.feature)}
              >
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:block w-64 border-r bg-background p-4 space-y-2">
        {sections.map((section) => {
          const isFeatureAvailable = 
            !section.feature || 
            (isLoading ? true : hasFeature(section.feature));
          
          return (
            <Button
              key={section.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 hover:bg-brand-green hover:text-white",
                activeSection === section.id && "bg-muted",
                section.feature && !isFeatureAvailable && "opacity-50"
              )}
              onClick={() => handleSectionChange(section.id, section.feature)}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
        
        {process.env.NODE_ENV === 'development' && (
          <div 
            className="mt-4 pt-4 border-t text-xs text-muted-foreground cursor-pointer" 
            onDoubleClick={handleDevModeToggle}
          >
            <p>Plan: {plan || 'Loading...'}</p>
            <p>Status: {subscription?.status || 'Loading...'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Test Mode: {isTestMode ? 'Enabled' : 'Disabled'}</p>
            <p className="mt-1 text-xs italic">Double-click to toggle test mode</p>
          </div>
        )}
      </div>
    </>
  );
}
