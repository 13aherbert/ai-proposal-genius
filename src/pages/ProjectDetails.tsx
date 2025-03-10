
import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjectDetails } from "@/hooks/use-project-details";
import { ProjectHeader } from "@/components/project/details/ProjectHeader";
import { ProjectLoading } from "@/components/project/details/ProjectLoading";
import { ProjectNotFound } from "@/components/project/details/ProjectNotFound";
import { ProjectContent } from "@/components/project/details/ProjectContent";

const ProjectDetails = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { data: project, isLoading, error } = useProjectDetails(id, session?.user);

  console.log("ProjectDetails - Project ID:", id);
  console.log("ProjectDetails - User:", session?.user?.id);
  console.log("ProjectDetails - Loading:", isLoading);
  console.log("ProjectDetails - Error:", error);
  console.log("ProjectDetails - Project:", project);

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (error || !project) {
    console.error("Project not found or error:", error);
    return <ProjectNotFound projectId={id} />;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <ProjectHeader title={project.title} />
          <ProjectContent project={project} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
