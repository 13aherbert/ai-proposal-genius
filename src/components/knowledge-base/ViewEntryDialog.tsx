import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  category: string;
}

export const ViewEntryDialog = ({
  open,
  onOpenChange,
  title,
  category,
}: ViewEntryDialogProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content, file_path')
        .eq('title', title)
        .single();

      if (error) throw error;
      setContent(data.content);
      setFilePath(data.file_path);
    } catch (error) {
      console.error('Error fetching entry content:', error);
      toast({
        title: "Error",
        description: "Failed to load entry content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('knowledge-files')
        .download(filePath);

      if (error) throw error;

      // Create a download link and trigger it
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchEntryContent();
    }
  }, [open, title]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium">Category:</span>
            <span className="ml-2 text-sm text-muted-foreground">{category}</span>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading content...</p>
          ) : filePath ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">This entry contains an uploaded document</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {content || "No content available"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};