import { Project } from "@/hooks/use-project-details";
import { ProjectInfoCard } from "./info/ProjectInfoCard";

interface ProjectInfoProps {
  project: Project;
}

/**
 * ProjectInfo Component
 * 
 * Displays detailed information about a project including:
 * - Basic project details (title, status, dates)
 * - Client and business information
 * - Document management interface
 * 
 * @param project - The project object containing all project details
 */
export function ProjectInfo({ project }: ProjectInfoProps) {
  return <ProjectInfoCard project={project} />;
}