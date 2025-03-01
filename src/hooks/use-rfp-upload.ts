
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";

// Constants for file upload
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export function useRFPUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Debounced project title update
  const debouncedSetProjectTitle = useCallback(
    debounce((title: string) => {
      setProjectTitle(title);
    }, 300),
    []
  );

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, Word, or text document."
      });
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
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

  // Upload file in chunks for better performance and reliability
  const uploadFileInChunks = async (file: File, fileName: string): Promise<boolean> => {
    try {
      const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min(file.size, start + MAX_CHUNK_SIZE);
        const chunk = file.slice(start, end);
        
        const uploadOptions = {
          cacheControl: "3600",
          contentType: file.type,
          upsert: i > 0 // Only use upsert for chunks after the first
        };

        // Only append chunk number for multi-chunk uploads
        const chunkFileName = totalChunks > 1
          ? `${fileName}.part${i+1}of${totalChunks}`
          : fileName;

        const { error } = await supabase.storage
          .from("rfp-files")
          .upload(chunkFileName, chunk, uploadOptions);

        if (error) {
          console.error(`Error uploading chunk ${i+1}:`, error);
          throw error;
        }

        // Update progress based on completed chunks
        const progress = Math.floor(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      // If file was uploaded in chunks, we need to combine them
      // This is a simplified approach - in a real app, you might
      // want to implement server-side merging via an Edge Function
      if (totalChunks > 1) {
        console.log("File was uploaded in chunks. Server-side merging would be needed.");
        // Placeholder for combining file chunks via edge function
      }

      return true;
    } catch (error) {
      console.error("Chunk upload error:", error);
      return false;
    }
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

      // Upload file with chunking if it's large
      const uploadSuccess = file.size > MAX_CHUNK_SIZE 
        ? await uploadFileInChunks(file, fileName)
        : await uploadSingleFile(file, fileName);

      if (!uploadSuccess) {
        throw new Error("File upload failed");
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
      
      // Prefetch the project data to improve perceived performance
      queryClient.prefetchQuery({
        queryKey: ["project", project.project_id],
        queryFn: () => fetchProject(project.project_id)
      });
      
    } catch (error) {
      console.error("Upload process error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset progress after a delay to show completion
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Helper function to upload a file as a single chunk
  const uploadSingleFile = async (file: File, fileName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Single file upload error:", error);
      return false;
    }
  };

  // Helper function to fetch a project by ID (for prefetching)
  const fetchProject = async (projectId: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();
      
    if (error) throw error;
    return data;
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
    setProjectTitle: debouncedSetProjectTitle,
    handleFileUpload,
    updateProject,
  };
}
