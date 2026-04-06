import { Project } from "@/hooks/use-project-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectEditForm } from "./ProjectEditForm";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectDocuments } from "./ProjectDocuments";
import AutomatedProposalCreation from "@/components/project/AutomatedProposalCreation";
import { useState } from "react";
import { Edit } from "lucide-react";

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col items-start">
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Details about your RFP project</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Edit className="h-4 w-4" />
            <span className="sm:inline">{isEditing ? "Cancel" : "Edit Details"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {isEditing ? (
          <ProjectEditForm 
            project={project} 
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <>
            <ProjectDetails project={project} />
            <ProjectDocuments project={project} />
            {project.rfp_file_path && (
              <AutomatedProposalCreation 
                projectId={project.project_id} 
                filePath={project.rfp_file_path} 
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}