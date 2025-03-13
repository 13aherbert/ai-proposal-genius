
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { useNavigate } from "react-router-dom";

interface ProjectsToolbarProps {
  canCreateProject: boolean;
  displayProjectLimit: number;
  projectCount?: number;
  isSubscriptionLoading: boolean;
  onRefresh: () => void;
}

export function ProjectsToolbar({
  canCreateProject,
  displayProjectLimit,
  projectCount,
  isSubscriptionLoading,
  onRefresh
}: ProjectsToolbarProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-start">
      <ProjectsHeader 
        canCreateProject={canCreateProject} 
        currentPlanLimit={displayProjectLimit} 
        projectCount={projectCount}
        isSubscriptionLoading={isSubscriptionLoading}
      />
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => navigate("/upload-rfp")}
          className="bg-brand-green hover:bg-brand-green-dark"
          disabled={!canCreateProject}
        >
          New Project
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Limits
        </Button>
      </div>
    </div>
  );
}
