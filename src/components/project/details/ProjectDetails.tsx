import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjectDetails } from "@/hooks/use-project-details";
import { ProjectHeader } from "@/components/project/details/ProjectHeader";
import { ProjectLoading } from "@/components/project/details/ProjectLoading";
import { ProjectNotFound } from "@/components/project/details/ProjectNotFound";
import { ProjectContent } from "@/components/project/details/ProjectContent";

/**
 * ProjectDetails Component
 * 
 * Main container component for displaying project details. Responsible for:
 * 1. Fetching and managing project data
 * 2. Handling loading and error states
 * 3. Organizing the overall layout structure
 * 4. Managing user authentication state
 * 
 * The component ensures proper data loading and error handling while
 * maintaining a consistent layout structure for all project-related content.
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