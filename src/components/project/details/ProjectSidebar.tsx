
import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText, FileEdit, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionFeatures, FeatureName } from "@/hooks/use-subscription-features";
import { toast } from "sonner";

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const { hasFeature, plan } = useSubscriptionFeatures();

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

  const handleSectionChange = (sectionId: string, feature: FeatureName | null) => {
    if (!feature || hasFeature(feature)) {
      onSectionChange(sectionId);
    } else {
      toast.error(
        `This feature is only available in the ${feature === "compiled_draft" || feature === "evaluation" ? "Professional" : "Starter"} plan`,
        {
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
      {sections.map((section) => (
        <Button
          key={section.id}
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 hover:bg-brand-green hover:text-white",
            activeSection === section.id && "bg-muted",
            section.feature && !hasFeature(section.feature) && "opacity-50"
          )}
          onClick={() => handleSectionChange(section.id, section.feature)}
        >
          <section.icon className="h-4 w-4" />
          {section.label}
        </Button>
      ))}
    </div>
  );
}
