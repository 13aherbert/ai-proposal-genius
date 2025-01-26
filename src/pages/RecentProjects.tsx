import { useAuth } from "@/components/AuthProvider";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { Loader2 } from "lucide-react";

const RecentProjects = () => {
  const { session } = useAuth();
  const { projects, isLoading, error } = useProjects(session?.user);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectsHeader />
        <ProjectsError />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectsHeader />
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ProjectsTable projects={projects || []} />
      )}
    </div>
  );
};

export default RecentProjects;