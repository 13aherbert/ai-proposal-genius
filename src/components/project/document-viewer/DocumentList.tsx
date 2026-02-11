
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
            key={doc.document_id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {doc.document_type}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
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
