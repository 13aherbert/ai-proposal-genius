import { Plus, ExternalLink } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-medium text-sm">Documents</h3>
          <p className="text-xs text-muted-foreground">RFP and supporting files</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Upload addendums and other project documents
              </DialogDescription>
            </DialogHeader>
            <DocumentUpload projectId={project.project_id} onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      {project.rfp_file_path && (
        <button
          type="button"
          onClick={() => handleView(project.rfp_file_path)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-md border bg-muted/40 hover:bg-muted text-sm transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-green/10 text-brand-green font-medium">RFP</span>
            <span className="truncate">Original RFP document</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      )}

      <DocumentList
        documents={documents || []}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
}
