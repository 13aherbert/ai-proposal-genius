import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { RFPAnalysis } from "@/components/project/RFPAnalysis";
import { ProposalOutline } from "@/components/project/proposal-outline/ProposalOutline";
import { ProposalEvaluation } from "@/components/project/proposal-evaluation/ProposalEvaluation";
import { ProposalDraft } from "@/components/project/proposal-draft/ProposalDraft";
import { useState } from "react";
import { ProjectSidebar } from "./ProjectSidebar";

interface ProjectContentProps {
  project: Project;
}

export function ProjectContent({ project }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("info");

  const renderSection = () => {
    switch (activeSection) {
      case "info":
        return <ProjectInfo project={project} />;
      case "analysis":
        return <RFPAnalysis filePath={project.rfp_file_path} projectId={project.id} />;
      case "outline":
        return <ProposalOutline projectId={project.id} analysis={project.analysis} />;
      case "draft":
        return (
          <ProposalDraft 
            projectId={project.id} 
            outline={project.proposal_outline}
            mode="draft"
          />
        );
      case "compiled":
        return (
          <ProposalDraft 
            projectId={project.id} 
            outline={project.proposal_outline}
            mode="compiled"
          />
        );
      case "evaluation":
        return <ProposalEvaluation projectId={project.id} analysis={project.analysis} />;
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