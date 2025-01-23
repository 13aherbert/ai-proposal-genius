import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { RFPAnalysis } from "@/components/project/RFPAnalysis";
import { ProposalOutline } from "@/components/project/proposal-outline/ProposalOutline";
import { ProposalDraft } from "@/components/project/proposal-draft/ProposalDraft";

interface ProjectContentProps {
  project: Project;
}

/**
 * Main content component for the project details page
 * Renders all project-related components in a grid layout
 */
export function ProjectContent({ project }: ProjectContentProps) {
  return (
    <div className="grid gap-6">
      <ProjectInfo project={project} />
      <RFPAnalysis filePath={project.rfp_file_path} projectId={project.id} />
      <ProposalOutline projectId={project.id} analysis={project.analysis} />
      <ProposalDraft projectId={project.id} outline={project.proposal_outline} />
    </div>
  );
}