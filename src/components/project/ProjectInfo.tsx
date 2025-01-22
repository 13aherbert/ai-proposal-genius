import { Project } from "@/hooks/use-project-details";
import { ProjectInfoCard } from "./info/ProjectInfoCard";

interface ProjectInfoProps {
  project: Project;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  return <ProjectInfoCard project={project} />;
}