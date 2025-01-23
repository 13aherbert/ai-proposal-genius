import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjectDetails } from "@/hooks/use-project-details";
import { ProjectHeader } from "@/components/project/details/ProjectHeader";
import { ProjectLoading } from "@/components/project/details/ProjectLoading";
import { ProjectNotFound } from "@/components/project/details/ProjectNotFound";
import { ProjectContent } from "@/components/project/details/ProjectContent";

/**
 * ProjectDetails page component
 * 
 * This component is responsible for:
 * 1. Loading project details using the project ID from URL params
 * 2. Handling loading and error states
 * 3. Rendering the appropriate project content when data is available
 * 
 * The component maintains the exact same functionality and UI as before,
 * but with improved code organization and maintainability.
 */
const ProjectDetails = () => {
  const { projectId } = useParams();
  const { session } = useAuth();
  const { data: project, isLoading } = useProjectDetails(projectId, session?.user);

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (!project) {
    return <ProjectNotFound />;
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