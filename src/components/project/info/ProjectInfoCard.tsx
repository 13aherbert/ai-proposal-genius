import { Project } from "@/hooks/use-project-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectEditForm } from "./ProjectEditForm";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectDocuments } from "./ProjectDocuments";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ProjectInfoCardProps {
  project: Project;
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CollapsibleTrigger>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <div className="flex flex-col items-start">
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Details about your RFP project</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Details
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}