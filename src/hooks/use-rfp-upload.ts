
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

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, Word, or text document."
      });
      return false;
    }
    
    // Check file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Maximum file size is 20MB."
      });
      return false;
    }
    
    return true;
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove any potentially problematic characters and normalize spaces
    return fileName
      .replace(/[^\x00-\x7F]/g, "")  // Remove non-ASCII characters
      .replace(/[^\w\s.-]/g, '')     // Remove special chars except .-_
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .toLowerCase();
  };

  const handleFileUpload = async (file: File, deadline?: Date) => {
    if (!session?.user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    // Validate the file first
    if (!validateFile(file)) {
      return;
    }

    try {
      setIsUploading(true);
      
      // Show initial progress
      setUploadProgress(10);

      // Sanitize the file name and create a unique path
      const fileExt = file.name.split(".").pop() || "";
      const sanitizedFileName = sanitizeFileName(file.name.replace(`.${fileExt}`, ""));
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${uniqueId}-${sanitizedFileName}.${fileExt}`;

      console.log("Attempting to upload file:", fileName);
      
      setUploadProgress(30);

      // Upload file to storage with proper content type
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

      setUploadProgress(60);
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

      setUploadProgress(80);
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

      setUploadProgress(100);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload process error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset progress after a delay to show completion
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const updateProject = async (
    title: string,
    deadline?: Date,
    clientName?: string,
    businessName?: string
  ) => {
    if (!projectId || !session?.user?.id) return;

    // Validate inputs
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }

    if (title.length > 100) {
      toast.error("Project title must be less than 100 characters");
      return;
    }

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
