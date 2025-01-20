import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeCategory } from "./types";
import { EntryHeader } from "./dialog/EntryHeader";
import { EntryCategory } from "./dialog/EntryCategory";
import { EntryContent } from "./dialog/EntryContent";
import { DeleteEntryAlert } from "./dialog/DeleteEntryAlert";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  category: string;
  categories: KnowledgeCategory[];
  onEntryUpdated: () => void;
}

export const ViewEntryDialog = ({
  open,
  onOpenChange,
  title: initialTitle,
  category: initialCategory,
  categories,
  onEntryUpdated,
}: ViewEntryDialogProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedCategory, setEditedCategory] = useState(initialCategory);
  const [editedContent, setEditedContent] = useState<string>("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content, file_path, id, user_id')  // Added user_id to selection
        .eq('title', initialTitle)
        .single();

      if (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }
      
      console.log('Fetched entry:', data);  // Log the fetched data
      setContent(data.content);
      setEditedContent(data.content || "");
      setFilePath(data.file_path);
      setEntryId(data.id);
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

  const handleSave = async () => {
    if (!entryId) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_entries')
        .update({
          title: editedTitle,
          category: editedCategory.toLowerCase().replace(/\s+/g, '-'),
          content: filePath ? null : editedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
      
      setIsEditing(false);
      onEntryUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!entryId) return;

    // Get current session to check authentication
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current user:', session?.user);  // Log current user

    try {
      const { error } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Delete error:', error);  // Log delete error
        throw error;
      }

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('knowledge-files')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting file:', storageError);
        }
      }

      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      
      onEntryUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('knowledge-files')
        .download(filePath);

      if (error) throw error;

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
      setEditedTitle(initialTitle);
      setEditedCategory(initialCategory);
      setIsEditing(false);
    }
  }, [open, initialTitle]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <EntryHeader
              isEditing={isEditing}
              initialTitle={initialTitle}
              editedTitle={editedTitle}
              onEditedTitleChange={setEditedTitle}
              onStartEditing={() => setIsEditing(true)}
              onCancelEditing={() => setIsEditing(false)}
              onSave={handleSave}
              onDelete={() => setShowDeleteAlert(true)}
            />
          </DialogHeader>
          <div className="space-y-4">
            <EntryCategory
              isEditing={isEditing}
              initialCategory={initialCategory}
              editedCategory={editedCategory}
              categories={categories}
              onEditedCategoryChange={setEditedCategory}
            />
            <EntryContent
              isLoading={isLoading}
              filePath={filePath}
              content={content}
              isEditing={isEditing}
              editedContent={editedContent}
              onEditedContentChange={setEditedContent}
              onDownload={handleDownload}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DeleteEntryAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirmDelete={handleDelete}
        hasFile={!!filePath}
      />
    </>
  );
};
