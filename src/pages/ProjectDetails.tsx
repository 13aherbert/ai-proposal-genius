
import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjectDetails } from "@/hooks/use-project-details";
import { ProjectHeader } from "@/components/project/details/ProjectHeader";
import { ProjectLoading } from "@/components/project/details/ProjectLoading";
import { ProjectNotFound } from "@/components/project/details/ProjectNotFound";
import { ProjectContent } from "@/components/project/details/ProjectContent";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { session } = useAuth();
  const { data: project, isLoading, error } = useProjectDetails(projectId, session?.user);

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (error || !project) {
    
    return <ProjectNotFound projectId={projectId} />;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <ProjectHeader title={project.title} />
      <ProjectContent project={project} />
    </div>
  );
};

export default ProjectDetails;
