import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadMode, EntryFormData } from "./types";

export const useEntryForm = (onSuccess: () => void) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setContent("");
    setSelectedFile(null);
    setUploadMode('text');
  };

  const handleSubmit = async (userId: string) => {
    if (!title || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsSubmitting(true);
      let filePath = null;

      if (uploadMode === 'file' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('knowledge-files')
          .upload(`${userId}/${fileName}`, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error("Failed to upload file");
          return;
        }

        filePath = data.path;
      }

      const { error: insertError } = await supabase
        .from('knowledge_entries')
        .insert({
          title,
          category: category.toLowerCase().replace(/\s+/g, '-'),
          content: uploadMode === 'text' ? content : null,
          file_path: filePath,
          user_id: userId
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error("Failed to save entry");
        return;
      }

      toast.success("Entry added successfully!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData: { title, category, content, file: selectedFile },
    setTitle,
    setCategory,
    setContent,
    setSelectedFile,
    uploadMode,
    setUploadMode,
    isSubmitting,
    handleSubmit,
  };
};