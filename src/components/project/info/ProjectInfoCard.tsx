import { Project } from "@/hooks/use-project-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProjectEditForm } from "./ProjectEditForm";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectDocuments } from "./ProjectDocuments";
import AutomatedProposalCreation from "@/components/project/AutomatedProposalCreation";
import { useState } from "react";
import { Pencil } from "lucide-react";

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Project Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectDetails project={project} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ProjectDocuments project={project} />
          </CardContent>
        </Card>
      </div>

      {project.rfp_file_path && (
        <AutomatedProposalCreation
          projectId={project.project_id}
          filePath={project.rfp_file_path}
        />
      )}

      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Project</SheetTitle>
            <SheetDescription>Update the details of your RFP project</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProjectEditForm
              project={project}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => setIsEditing(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
