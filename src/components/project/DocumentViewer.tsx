import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { DocumentList } from "./document-viewer/DocumentList";
import { DocumentUpload } from "./document-viewer/DocumentUpload";
import { useDocuments } from "./document-viewer/useDocuments";
import type { DocumentViewerProps } from "./document-viewer/types";

export function DocumentViewer({ filePath, project }: DocumentViewerProps) {
  const { documents, handleDelete, handleView } = useDocuments(project.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Document</CardTitle>
        <CardDescription>Access the original RFP document and additional files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          variant="outline"
          onClick={() => handleView(filePath)}
        >
          View RFP Document
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="ml-2">
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
              projectId={project.id}
              onSuccess={() => {}}
            />
          </DialogContent>
        </Dialog>

        <DocumentList 
          documents={documents || []}
          onView={handleView}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
}