import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EntryFormData, UploadMode } from "./types";

/**
 * Custom hook for managing knowledge base entry form operations
 * Handles both file uploads and text content entries with proper error handling
 */
export const useEntryForm = (onSuccess: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Creates a sanitized filename from the entry title
   * Converts to lowercase and replaces non-alphanumeric chars with hyphens
   */
  const createSanitizedFilename = (title: string, extension: string): string => {
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${sanitizedTitle}.${extension}`;
  };

  /**
   * Handles file upload to Supabase storage
   * Returns the file path if successful, throws error if failed
   */
  const handleFileUpload = async (
    userId: string,
    file: File,
    title: string
  ): Promise<string> => {
    const fileExt = file.name.split('.').pop() || '';
    const fileName = createSanitizedFilename(title, fileExt);
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('knowledge-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    return filePath;
  };

  /**
   * Creates a new knowledge entry in the database
   * Returns the entry ID if successful, throws error if failed
   */
  const createKnowledgeEntry = async (
    userId: string,
    data: EntryFormData,
    filePath?: string
  ): Promise<string> => {
    const { error: insertError, data: insertData } = await supabase
      .from('knowledge_entries')
      .insert({
        title: data.title,
        content: data.uploadMode === 'text' ? data.content : null,
        category: data.category.toLowerCase().replace(/\s+/g, '-'),
        file_path: filePath || null,
        user_id: userId,
      })
      .select('id')
      .single();

    if (insertError || !insertData) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create entry');
    }

    return insertData.id;
  };

  /**
   * Main handler for form submission
   * Manages the entire process of creating an entry with proper error handling
   */
  const handleSubmit = async (data: EntryFormData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to create entries",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let filePath: string | undefined;
      
      if (data.uploadMode === 'file' && data.selectedFile) {
        filePath = await handleFileUpload(
          session.user.id,
          data.selectedFile,
          data.title
        );
      }

      await createKnowledgeEntry(session.user.id, data, filePath);

      toast({
        title: "Success",
        description: "Entry created successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
};