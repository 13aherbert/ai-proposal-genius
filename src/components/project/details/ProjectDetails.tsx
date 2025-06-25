
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

  console.log("ProjectDetails - Loading state:", isLoading);
  console.log("ProjectDetails - Error:", error);
  console.log("ProjectDetails - Project data:", project);

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (error) {
    console.error("Project loading error:", error);
    return <ProjectNotFound />;
  }

  if (!project) {
    return <ProjectNotFound />;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <ProjectHeader title={project.title} />
      <ProjectContent project={project} />
    </div>
  );
};

export default ProjectDetails;
