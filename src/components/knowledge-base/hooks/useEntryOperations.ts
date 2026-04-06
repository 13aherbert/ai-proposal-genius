
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
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const [parsingProgress, setParsingProgress] = useState<number>(0);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      console.log('Fetching entry content for title:', initialTitle);
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content, file_path, entry_id, user_id, parsed_content, parsing_status, parsing_progress, parsing_error, created_at, updated_at')
        .eq('title', initialTitle)
        .single();

      if (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }
      
      console.log('Fetched entry:', data);
      setContent(data.content || data.parsed_content);
      setFilePath(data.file_path);
      setEntryId(data.entry_id);
      setParsingStatus(data.parsing_status);
      setParsingProgress(data.parsing_progress || 0);
      setParsingError(data.parsing_error);
      setCreatedAt(data.created_at);
      setUpdatedAt(data.updated_at);
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
    if (!entryId) {
      console.error('Cannot save: No entry ID available');
      return;
    }
    
    try {
      console.log('Saving entry with ID:', entryId);
      const { error } = await supabase
        .from('knowledge_entries')
        .update({
          title: editedTitle,
          category: editedCategory.toLowerCase().replace(/\s+/g, '-'),
          content: filePath ? null : editedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('entry_id', entryId);

      if (error) throw error;

      console.log('Entry saved successfully');
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
    if (!entryId) {
      console.error('Cannot delete: No entry ID available');
      return;
    }

    try {
      // Log auth state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current auth session:', session);

      // If there's a file, delete it first
      if (filePath) {
        console.log('Starting file deletion process');
        console.log('File path to delete:', filePath);
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('knowledge-files')
          .remove([filePath]);

        console.log('Storage deletion response:', { data: storageData, error: storageError });

        if (storageError) {
          console.error('Error deleting file:', storageError);
          throw storageError;
        }
        console.log('File deleted successfully');
      }

      // Then delete the database entry
      console.log('Starting database entry deletion');
      console.log('Entry ID to delete:', entryId);
      
      const { data: dbData, error: dbError } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('entry_id', entryId);

      console.log('Database deletion response:', { data: dbData, error: dbError });

      if (dbError) {
        console.error('Error deleting entry:', dbError);
        throw dbError;
      }

      console.log('Entry deleted successfully');
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      
      onEntryUpdated();
      onClose();
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!filePath) {
      console.error('Cannot download: No file path available');
      return;
    }

    try {
      console.log('Attempting to download file:', filePath);
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

      console.log('File downloaded successfully');
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
    entryId,
    parsingStatus,
    parsingProgress,
    parsingError,
    createdAt,
    updatedAt,
    fetchEntryContent,
    handleSave,
    handleDelete,
    handleDownload,
  };
};
