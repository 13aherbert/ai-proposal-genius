
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface EntryContentProps {
  isLoading: boolean;
  filePath: string | null;
  content: string | null;
  isEditing: boolean;
  editedContent: string;
  onEditedContentChange: (content: string) => void;
  onSave: () => Promise<void>;
  onDownload: () => Promise<void>;
}

export const EntryContent = ({
  isLoading,
  filePath,
  content,
  isEditing,
  editedContent,
  onEditedContentChange,
  onSave,
  onDownload,
}: EntryContentProps) => {
  if (isLoading) {
    return <p className="text-muted-foreground">Loading content...</p>;
  }

  if (filePath) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            This entry contains an uploaded document
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download File
          </Button>
        </div>
        
        {content && (
          <ScrollArea className="h-[400px] w-full rounded-lg border p-4">
            <div className="prose prose-sm max-w-none">
              {content}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isEditing ? (
        <Textarea
          value={editedContent}
          onChange={(e) => onEditedContentChange(e.target.value)}
          className="min-h-[200px]"
        />
      ) : (
        <ScrollArea className="h-[400px] w-full">
          <div className="prose prose-sm max-w-none">
            {content || "No content available"}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
