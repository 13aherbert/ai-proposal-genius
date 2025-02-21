
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useRFPUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const handleFileUpload = async (file: File, deadline?: Date) => {
    if (!session?.user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    try {
      setIsUploading(true);
      
      // Sanitize the file name and create a unique path
      const fileExt = file.name.split(".").pop();
      const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${uniqueId}-${sanitizedFileName}`;

      console.log("Attempting to upload file:", fileName);

      // Upload file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log("File uploaded successfully, creating project...");

      // Create the project with specific column selection
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: file.name.replace(`.${fileExt}`, ""),
          rfp_file_path: fileName,
          deadline: deadline?.toISOString(),
          status: 'draft',
          user_id: session.user.id
        })
        .select('project_id, title, user_id')
        .single();

      if (projectError) {
        console.error("Project creation error:", projectError);
        throw new Error(`Project creation failed: ${projectError.message}`);
      }

      if (!project) {
        throw new Error("No project data returned after creation");
      }

      console.log("Project created successfully:", project);

      setProjectId(project.project_id);
      setProjectTitle(project.title);

      // Create project document
      const { error: docError } = await supabase
        .from("project_documents")
        .insert({
          project_id: project.project_id,
          file_name: file.name,
          file_path: fileName,
          document_type: 'rfp',
          user_id: session.user.id
        });

      if (docError) {
        console.error("Document creation error:", docError);
        // Log but don't throw, as the main project was created successfully
      }

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload process error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
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
    if (!projectId || !session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          deadline: deadline?.toISOString(),
          client_name: clientName,
          business_name: businessName
        })
        .eq("project_id", projectId)
        .eq("user_id", session.user.id);

      if (error) throw error;
      
      // Invalidate both the project details and projects list queries
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      
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
