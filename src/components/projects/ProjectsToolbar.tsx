
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";

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
  return (
    <div className="flex justify-between items-start">
      <ProjectsHeader 
        canCreateProject={canCreateProject} 
        currentPlanLimit={displayProjectLimit} 
        projectCount={projectCount}
        isSubscriptionLoading={isSubscriptionLoading}
      />
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
  );
}
