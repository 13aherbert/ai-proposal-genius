import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "./use-subscription";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { STARTER_USER_ID, isStarterUser } from "./subscription/feature-access";

export const useRFPUpload = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: subscriptionData } = useSubscription();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Check if this is the starter user
  const isUserStarter = session?.user?.id === STARTER_USER_ID || isStarterUser();
  
  // Get project limit from subscription data, with fallback to trial limit
  // Force the starter limit for starter users
  const projectLimit = isUserStarter
    ? SUBSCRIPTION_PLAN_LIMITS.starter
    : subscriptionData?.project_limit || SUBSCRIPTION_PLAN_LIMITS.trial;
  
  // Get current project count from database
  const [currentProjectCount, setCurrentProjectCount] = useState<number | null>(null);

  // Fetch project count on component mount
  const fetchProjectCount = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setFetchError(null);
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      setCurrentProjectCount(count || 0);
    } catch (error) {
      console.error('Error fetching project count:', error);
      setFetchError(error as Error);
      // Don't reset the count to 0 on error, keep previous value
      // This prevents UI flashing between states on network errors
    }
  }, [session]);

  // Call fetch project count when session changes
  useEffect(() => {
    if (session?.user) {
      fetchProjectCount();
    }
  }, [session, fetchProjectCount]);

  const handleFileUpload = useCallback(async (file: File, deadline?: Date) => {
    if (!session?.user) {
      toast.error("Please sign in to upload RFPs");
      return;
    }
    
    // Fetch the latest count before checking limits
    await fetchProjectCount();
    
    // Check if user has reached their project limit
    if (currentProjectCount !== null && projectLimit !== null && currentProjectCount >= projectLimit) {
      toast.error(`Project limit reached (${currentProjectCount}/${projectLimit})`, { 
        description: "Please delete some projects or upgrade your plan."
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 7);
      const fileName = `${timestamp}-${randomId}-${file.name}`;
      
      // Upload the file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('rfp_documents')
        .upload(fileName, file);

      // Handle upload progress separately
      let uploadProgress = 0;
      const interval = setInterval(() => {
        uploadProgress += 10;
        if (uploadProgress <= 50) {
          setUploadProgress(uploadProgress);
        }
      }, 100);

      if (uploadError) {
        clearInterval(interval);
        throw uploadError;
      }
      
      clearInterval(interval);
      setUploadProgress(60);
      
      // Create a project entry in the database
      const newProject = {
        project_id: uuidv4(),
        user_id: session.user.id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for initial title
        status: "draft",
        rfp_file_path: fileName,
        deadline: deadline ? deadline.toISOString() : null,
      };
      
      setUploadProgress(70);
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
        
      if (projectError) {
        throw projectError;
      }
      
      // Set the project ID and title for the form
      setProjectId(project.project_id);
      setProjectTitle(project.title);
      
      setUploadProgress(90);
      
      // Update project count
      fetchProjectCount();
      
      // Invalidate projects query cache to refresh project lists
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      setUploadProgress(100);
      toast.success("RFP uploaded successfully");
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      // Keep isUploading true until the upload progress animation completes
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  }, [session, projectLimit, currentProjectCount, queryClient, fetchProjectCount]);

  const updateProject = useCallback(async (
    title: string, 
    deadline?: Date,
    clientName?: string,
    businessName?: string
  ) => {
    if (!projectId || !session?.user) return;
    
    try {
      const updates = {
        title,
        deadline: deadline ? deadline.toISOString() : null,
        client_name: clientName || null,
        business_name: businessName || null,
        last_update_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Update failed", {
        description: error.message || "Please try again.",
      });
    }
  }, [projectId, session, queryClient]);
  
  return {
    uploadProgress,
    isUploading,
    projectId,
    projectTitle,
    projectLimit,
    currentProjectCount,
    fetchError,
    setProjectTitle,
    handleFileUpload,
    updateProject,
    fetchProjectCount
  };
};
