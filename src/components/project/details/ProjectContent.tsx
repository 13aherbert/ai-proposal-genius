import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { RFPAnalysis } from "@/components/project/RFPAnalysis";
import { ProposalOutline } from "@/components/project/proposal-outline/ProposalOutline";
import { ProposalEvaluation } from "@/components/project/proposal-evaluation/ProposalEvaluation";
import { ProposalDraft } from "@/components/project/proposal-draft/ProposalDraft";
import { useState } from "react";
import { ProjectSidebar } from "./ProjectSidebar";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { toast } from "sonner";

interface ProjectContentProps {
  project: Project;
}

export function ProjectContent({ project }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("info");
  const { hasFeature, getPlanName } = useSubscriptionFeatures();

  const renderSection = () => {
    switch (activeSection) {
      case "info":
        return <ProjectInfo project={project} />;
      case "analysis":
        return hasFeature("rfp_summary") ? (
          <RFPAnalysis filePath={project.rfp_file_path} projectId={project.id} />
        ) : (
          toast.error(`This feature is only available with ${getPlanName("rfp_summary")}`)
        );
      case "outline":
        return hasFeature("proposal_outline") ? (
          <ProposalOutline projectId={project.id} analysis={project.analysis} />
        ) : (
          toast.error(`This feature is only available with ${getPlanName("proposal_outline")}`)
        );
      case "draft":
        return hasFeature("proposal_draft") ? (
          <ProposalDraft 
            projectId={project.id} 
            outline={project.proposal_outline}
            mode="draft"
          />
        ) : (
          toast.error(`This feature is only available with ${getPlanName("proposal_draft")}`)
        );
      case "compiled":
        return hasFeature("compiled_draft") ? (
          <ProposalDraft 
            projectId={project.id} 
            outline={project.proposal_outline}
            mode="compiled"
          />
        ) : (
          toast.error(`This feature is only available with ${getPlanName("compiled_draft")}`)
        );
      case "evaluation":
        return hasFeature("evaluation") ? (
          <ProposalEvaluation projectId={project.id} analysis={project.analysis} />
        ) : (
          toast.error(`This feature is only available with ${getPlanName("evaluation")}`)
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <ProjectSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 p-6">
        {renderSection()}
      </div>
    </div>
  );
}