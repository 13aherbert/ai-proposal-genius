import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { RFPAnalysis } from "@/components/project/RFPAnalysis";
import { ProposalOutline } from "@/components/project/proposal-outline/ProposalOutline";
import { ProposalDraft } from "@/components/project/proposal-draft/ProposalDraft";
import { ProposalEvaluation } from "@/components/project/proposal-evaluation/ProposalEvaluation";

interface ProjectContentProps {
  project: Project;
}

/**
 * ProjectContent Component
 * 
 * Organizes and displays all project-related content sections. Responsible for:
 * 1. Rendering project information and details
 * 2. Managing RFP analysis display
 * 3. Coordinating proposal components (outline, draft, evaluation)
 * 4. Maintaining proper spacing and layout between sections
 * 
 * The component ensures a consistent and organized display of all
 * project-related information while maintaining proper component hierarchy.
 * 
 * @param project - The project object containing all necessary data
 */
export function ProjectContent({ project }: ProjectContentProps) {
  return (
    <div className="grid gap-6">
      <ProjectInfo project={project} />
      <RFPAnalysis filePath={project.rfp_file_path} projectId={project.id} />
      <ProposalOutline projectId={project.id} analysis={project.analysis} />
      <ProposalDraft projectId={project.id} outline={project.proposal_outline} />
      <ProposalEvaluation projectId={project.id} analysis={project.analysis} />
    </div>
  );
}