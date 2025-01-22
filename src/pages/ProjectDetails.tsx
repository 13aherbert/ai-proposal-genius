import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { RFPAnalysis } from "@/components/project/RFPAnalysis";
import { useProjectDetails } from "@/hooks/use-project-details";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: project, isLoading } = useProjectDetails(projectId, session?.user);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/recent-projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Loading project...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/recent-projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Project not found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/recent-projects")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{project.title}</h1>
          </header>

          <div className="grid gap-6">
            <ProjectInfo project={project} />
            <RFPAnalysis filePath={project.rfp_file_path} projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;