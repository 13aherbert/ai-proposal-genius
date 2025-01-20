import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content')
        .eq('title', title)
        .single();

      if (error) throw error;
      setContent(data.content);
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

  useState(() => {
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