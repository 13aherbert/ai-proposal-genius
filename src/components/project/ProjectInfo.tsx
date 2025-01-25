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
 * The component is responsible for:
 * 1. Organizing project information in a structured layout
 * 2. Providing document management capabilities
 * 3. Enabling project detail updates
 * 
 * @param project - The project object containing all project details
 */
export function ProjectInfo({ project }: ProjectInfoProps) {
  return <ProjectInfoCard project={project} />;
}