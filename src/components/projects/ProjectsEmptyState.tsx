
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProjectsEmptyStateProps {
  projectLimit: number;
}

export function ProjectsEmptyState({ projectLimit }: ProjectsEmptyStateProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-muted/40 rounded-lg h-[400px] text-center space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">No projects yet</h3>
        <p className="text-muted-foreground">
          Create your first project to start generating proposal drafts and analyzing RFPs.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Your current plan allows up to {projectLimit} projects.
        </p>
      </div>
      <Button onClick={() => navigate("/upload-rfp")}>
        Create a Project
      </Button>
    </div>
  );
}
