
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

      // Insert project with proper column names and schema
      const { data: insertedProject, error: insertError } = await supabase
        .from("projects")
        .insert([{
          title: file.name.replace(`.${fileExt}`, ""),
          rfp_file_path: fileName,
          deadline: deadline?.toISOString(),
          status: 'draft',
          user_id: session.user.id
        }])
        .select(`
          project_id,
          title
        `)
        .single();

      if (insertError) throw insertError;
      if (!insertedProject) throw new Error("Failed to create project");

      setProjectId(insertedProject.project_id);
      setProjectTitle(insertedProject.title);
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
          business_name: businessName
        })
        .eq("project_id", projectId);

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
