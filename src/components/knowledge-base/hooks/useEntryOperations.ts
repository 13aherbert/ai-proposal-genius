import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEntryOperations = (
  initialTitle: string,
  onEntryUpdated: () => void,
  onClose: () => void
) => {
  const [content, setContent] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [entryId, setEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content, file_path, id, user_id')
        .eq('title', initialTitle)
        .single();

      if (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }
      
      console.log('Fetched entry:', data);
      setContent(data.content);
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

  const handleSave = async (
    editedTitle: string,
    editedCategory: string,
    editedContent: string
  ) => {
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
      
      onEntryUpdated();
      onClose();
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

    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current user:', session?.user);

    try {
      const { error } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Delete error:', error);
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
      onClose();
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

  return {
    content,
    filePath,
    isLoading,
    fetchEntryContent,
    handleSave,
    handleDelete,
    handleDownload,
  };
};