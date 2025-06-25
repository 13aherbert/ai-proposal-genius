
import { FileUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectsEmptyStateProps {
  projectLimit: number;
  organizationId?: string | null;
}

export function ProjectsEmptyState({ projectLimit, organizationId }: ProjectsEmptyStateProps) {
  const navigate = useNavigate();

  // Handle case where user has no organization
  if (organizationId === null) {
    return (
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Organization Setup Required</CardTitle>
          <CardDescription>
            You need to be part of an organization to create and manage projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate("/account")}
            className="bg-brand-green hover:bg-brand-green/90"
          >
            Set Up Organization
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileUp className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle>No projects yet</CardTitle>
        <CardDescription>
          Create your first project by uploading an RFP document. You can create up to {projectLimit} projects with your current plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => navigate("/upload-rfp")}
          className="bg-brand-green hover:bg-brand-green/90"
        >
          Upload Your First RFP
        </Button>
      </CardContent>
    </Card>
  );
}
