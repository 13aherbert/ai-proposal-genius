
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentList } from "./document-viewer/DocumentList";
import { DocumentUpload } from "./document-viewer/DocumentUpload";
import { useDocuments } from "./document-viewer/useDocuments";
import type { Project } from "@/hooks/use-project-details";

interface AdditionalDocumentsProps {
  project: Project;
}

export function AdditionalDocuments({ project }: AdditionalDocumentsProps) {
  const { documents, handleDelete, handleView } = useDocuments(project.project_id);

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Additional Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload additional documents related to this project
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Additional Document</DialogTitle>
              <DialogDescription>
                Upload addendums and other project documents
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload 
              projectId={project.project_id}
              onSuccess={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DocumentList 
        documents={documents || []}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
}
