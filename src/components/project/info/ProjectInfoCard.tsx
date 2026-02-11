import { Project } from "@/hooks/use-project-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectEditForm } from "./ProjectEditForm";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectDocuments } from "./ProjectDocuments";
import { AutomatedProposalCreation } from "../AutomatedProposalCreation";
import { useState } from "react";
import { Bot, Edit } from "lucide-react";

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col items-start">
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Details about your RFP project</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                setShowAutomation(true);
                setIsEditing(false);
              }}
              disabled={!project.rfp_file_path}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Bot className="h-4 w-4" />
              <span className="sm:inline">Automate Proposal</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(true);
                setShowAutomation(false);
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Edit className="h-4 w-4" />
              <span className="sm:inline">Edit Details</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {isEditing ? (
          <ProjectEditForm 
            project={project} 
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : showAutomation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Automated Proposal Creation</h3>
              <Button
                variant="ghost"
                onClick={() => setShowAutomation(false)}
                className="text-sm"
              >
                Back to Details
              </Button>
            </div>
            <AutomatedProposalCreation 
              projectId={project.project_id}
              filePath={project.rfp_file_path}
            />
          </div>
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