
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export function useRFPUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const { session } = useAuth();

  const handleFileUpload = async (file: File, deadline?: Date) => {
    if (!session?.user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError, data } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) throw uploadError;

      // First, insert the project without returning data
      const { error: insertError } = await supabase
        .from("projects")
        .insert({
          title: file.name.replace(`.${fileExt}`, ""),
          rfp_file_path: fileName,
          user_id: session.user.id,
          deadline: deadline?.toISOString(),
        });

      if (insertError) throw insertError;

      // Then, fetch the project in a separate query
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("id, title, rfp_file_path, deadline, created_at, status")
        .eq("user_id", session.user.id)
        .eq("rfp_file_path", fileName)
        .single();

      if (fetchError) throw fetchError;
      if (!project) throw new Error("Failed to create project");

      setProjectId(project.id);
      setProjectTitle(project.title);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const updateProject = async (
    title: string,
    deadline?: Date,
    clientName?: string,
    businessName?: string
  ) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          deadline: deadline?.toISOString(),
          client_name: clientName,
          business_name: businessName,
        })
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update project");
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
}
