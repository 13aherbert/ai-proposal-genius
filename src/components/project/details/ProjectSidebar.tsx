
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText, FileEdit, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionFeatures, FeatureName } from "@/hooks/use-subscription-features";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { useEffect } from "react";

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const { hasFeature, plan, isLoading } = useSubscriptionFeatures();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const sections = [
    {
      id: "info",
      label: "Project Info",
      icon: FileText,
      feature: null,
    },
    {
      id: "analysis",
      label: "RFP Summary",
      icon: ScrollText,
      feature: "rfp_summary" as FeatureName,
    },
    {
      id: "outline",
      label: "Proposal Outline",
      icon: LayoutTemplate,
      feature: "proposal_outline" as FeatureName,
    },
    {
      id: "draft",
      label: "Proposal Draft",
      icon: FileEdit,
      feature: "proposal_draft" as FeatureName,
    },
    {
      id: "compiled",
      label: "Compiled Draft",
      icon: BookOpen,
      feature: "compiled_draft" as FeatureName,
    },
    {
      id: "evaluation",
      label: "Evaluation",
      icon: CheckSquare,
      feature: "evaluation" as FeatureName,
    },
  ] as const;

  // Enhanced debug information
  useEffect(() => {
    console.log("ProjectSidebar - Subscription Plan:", plan);
    console.log("ProjectSidebar - Plan from subscription object:", subscription?.plan_type);
    console.log("ProjectSidebar - Subscription Status:", subscription?.status);
    console.log("ProjectSidebar - isLoading (features):", isLoading);
    console.log("ProjectSidebar - isLoading (subscription):", subscriptionLoading);
    
    const featureAvailability = {} as Record<FeatureName, boolean>;
    sections.forEach(section => {
      if (section.feature) {
        featureAvailability[section.feature] = hasFeature(section.feature);
      }
    });
    console.log("Feature availability:", featureAvailability);
    
  }, [plan, isLoading, subscriptionLoading, subscription]);

  const handleSectionChange = (sectionId: string, feature: FeatureName | null) => {
    if (!feature || hasFeature(feature)) {
      onSectionChange(sectionId);
    } else {
      // Check if subscription is still loading before showing error
      if (isLoading || subscriptionLoading) {
        toast.loading("Checking your subscription status...");
        return;
      }
      
      // Determine the required plan based on the feature
      const requiredPlan = 
        feature === "compiled_draft" || feature === "evaluation" 
          ? "Professional" 
          : "Starter";
      
      // Show a more informative toast message
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
    <div className="w-64 border-r bg-background p-4 space-y-2">
      {sections.map((section) => {
        // Don't check feature availability while loading to prevent flickering
        const isFeatureAvailable = 
          !section.feature || 
          (isLoading ? false : hasFeature(section.feature));
        
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
      
      {/* Subscription status indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>Plan: {plan || 'Loading...'}</p>
          <p>Status: {subscription?.status || 'Loading...'}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}
