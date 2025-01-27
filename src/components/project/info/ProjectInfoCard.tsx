import { Project } from "@/hooks/use-project-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectEditForm } from "./ProjectEditForm";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectDocuments } from "./ProjectDocuments";
import { useState } from "react";

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Details about your RFP project</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
          >
            Edit Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}