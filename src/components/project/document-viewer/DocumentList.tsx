import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import type { DocumentListProps } from "./types";

export function DocumentList({ documents, onView, onDelete }: DocumentListProps) {
  if (!documents?.length) return null;

  return (
    <div className="space-y-4 mt-4">
      <h3 className="font-medium">Additional Documents</h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {doc.document_type}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(doc.file_path)}
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(doc)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}