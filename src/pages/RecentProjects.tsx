import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { ProjectsTable } from "@/components/projects/ProjectsTable";

const RecentProjects = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Add authentication check
  if (!session?.user) {
    navigate("/");
    return null;
  }

  const { projects, isLoading, error, refetch, deleteProject } = useProjects(session.user);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <ProjectsHeader />

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                View and manage your RFP projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <ProjectsError onRetry={refetch} />
              ) : isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !projects?.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  No projects found. Create your first project by clicking "New
                  Project" above.
                </div>
              ) : (
                <ProjectsTable projects={projects} onDelete={deleteProject} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecentProjects;