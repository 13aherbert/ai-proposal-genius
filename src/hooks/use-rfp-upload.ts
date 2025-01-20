import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export const useRFPUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const { session } = useAuth();

  const handleFileUpload = async (file: File, deadline?: Date) => {
    if (!file || !session?.user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = async () => {
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('rfp-files')
          .upload(sanitizedFileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { error: projectError, data: projectData } = await supabase
          .from('projects')
          .insert({
            title: file.name.replace(`.${fileExt}`, ''),
            rfp_file_path: sanitizedFileName,
            user_id: session.user.id,
            deadline: deadline?.toISOString(),
          })
          .select()
          .single();

        if (projectError) {
          await supabase.storage
            .from('rfp-files')
            .remove([sanitizedFileName]);
          throw projectError;
        }

        setProjectId(projectData.id);
        setProjectTitle(projectData.title);
        setUploadProgress(100);
        toast.success("Project created successfully!");
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      };

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to create project. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const updateProject = async (title: string, deadline?: Date) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          title,
          deadline: deadline?.toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Failed to update project. Please try again.");
    }
  };

  return {
    uploadProgress,
    isUploading,
    projectId,
    projectTitle,
    setProjectTitle,
    handleFileUpload,
    updateProject,
  };
};