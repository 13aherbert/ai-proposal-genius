
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText, FileEdit, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionFeatures, FeatureName } from "@/hooks/use-subscription-features";
import { toast } from "sonner";
import { useEffect } from "react";

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const { hasFeature, plan, isLoading } = useSubscriptionFeatures();

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

  // Debug information once when component loads
  useEffect(() => {
    console.log("ProjectSidebar - Subscription Plan:", plan);
    console.log("ProjectSidebar - isLoading:", isLoading);
    
    sections.forEach(section => {
      if (section.feature) {
        console.log(`ProjectSidebar - Feature ${section.feature} available:`, hasFeature(section.feature));
      }
    });
  }, [plan, isLoading]);

  const handleSectionChange = (sectionId: string, feature: FeatureName | null) => {
    if (!feature || hasFeature(feature)) {
      onSectionChange(sectionId);
    } else {
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
        const isFeatureAvailable = !section.feature || hasFeature(section.feature);
        
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
    </div>
  );
}
