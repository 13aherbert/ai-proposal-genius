
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
import { DocumentList } from "../document-viewer/DocumentList";
import { DocumentUpload } from "../document-viewer/DocumentUpload";
import { useDocuments } from "../document-viewer/useDocuments";
import type { Project } from "@/hooks/use-project-details";

interface ProjectDocumentsProps {
  project: Project;
}

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const { documents, handleDelete, handleView } = useDocuments(project.project_id);

  return (
    <div className="border-t pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-medium">RFP Documents</h3>
          <p className="text-sm text-muted-foreground">Access the original RFP document and additional files</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => handleView(project.rfp_file_path)}
            className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark w-full sm:w-auto"
          >
            View RFP Document
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark w-full sm:w-auto"
              >
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
      </div>

      <DocumentList 
        documents={documents || []}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
}
