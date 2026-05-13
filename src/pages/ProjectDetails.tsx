
import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjectDetails } from "@/hooks/use-project-details";
import { ProjectHeader } from "@/components/project/details/ProjectHeader";
import { ProjectLoading } from "@/components/project/details/ProjectLoading";
import { ProjectNotFound } from "@/components/project/details/ProjectNotFound";
import { ProjectContent } from "@/components/project/details/ProjectContent";
import { useSEO } from "@/hooks/use-seo";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { session } = useAuth();
  const { data: project, isLoading, error } = useProjectDetails(projectId, session?.user);
  const seoTitle = project
    ? `${project.title}${project.client_name ? ` — ${project.client_name}` : ""} | OptiRFP`
    : "Project — OptiRFP";
  const seoDescription = project
    ? `Work on the ${project.title} RFP${project.client_name ? ` for ${project.client_name}` : ""} in OptiRFP — analysis, outline, AI drafting, compliance tracking, and export.`
    : "Work on your RFP project in OptiRFP: analysis, outline, AI drafting, compliance tracking, and export.";
  useSEO({ title: seoTitle, description: seoDescription });

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (error || !project) {
    
    return <ProjectNotFound projectId={projectId} />;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <ProjectHeader
        title={project.title}
        status={project.status}
        clientName={project.client_name}
        deadline={project.deadline}
      />
      <ProjectContent project={project} />
    </div>
  );
};

export default ProjectDetails;
