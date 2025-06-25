
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EntryFormData, UploadMode } from "./types";

export const useEntryForm = (onSuccess: () => void) => {
  const [formData, setFormData] = useState<EntryFormData>({
    title: '',
    category: '',
    content: '',
    uploadMode: 'text',
    selectedFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setTitle = (title: string) => setFormData(prev => ({ ...prev, title }));
  const setCategory = (category: string) => setFormData(prev => ({ ...prev, category }));
  const setContent = (content: string) => setFormData(prev => ({ ...prev, content }));
  const setSelectedFile = (file: File | null) => setFormData(prev => ({ ...prev, selectedFile: file }));
  const setUploadMode = (mode: UploadMode) => setFormData(prev => ({ ...prev, uploadMode: mode }));

  const createSanitizedFilename = (title: string, extension: string): string => {
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${sanitizedTitle}.${extension}`;
  };

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
      .select('entry_id')
      .single();

    if (insertError || !insertData) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create entry');
    }

    return insertData.entry_id;
  };

  const handleSubmit = async (userId: string) => {
    setIsSubmitting(true);

    try {
      let filePath: string | undefined;
      
      if (formData.uploadMode === 'file' && formData.selectedFile) {
        filePath = await handleFileUpload(
          userId,
          formData.selectedFile,
          formData.title
        );
      }

      await createKnowledgeEntry(userId, formData, filePath);

      toast.success("Entry created successfully");
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setTitle,
    setCategory,
    setContent,
    setSelectedFile,
    uploadMode: formData.uploadMode,
    setUploadMode,
    isSubmitting,
    handleSubmit,
  };
};
