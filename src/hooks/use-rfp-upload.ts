
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "./use-subscription";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { getStoredSubscriptionData, isUserOfPlanType } from "./subscription/feature-access";

export const useRFPUpload = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: subscriptionData, loading: subscriptionLoading } = useSubscription();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const storedSubscriptionData = getStoredSubscriptionData();
  
  let isUserPro = false;
  let isUserStarter = false;
  
  if (storedSubscriptionData && storedSubscriptionData.plan_type) {
    const planType = storedSubscriptionData.plan_type.toLowerCase();
    isUserPro = planType === 'pro';
    isUserStarter = planType === 'starter' || planType === 'standard';
  } else if (subscriptionData && subscriptionData.plan_type) {
    const planType = subscriptionData.plan_type.toLowerCase();
    isUserPro = planType === 'pro';
    isUserStarter = planType === 'starter' || planType === 'standard';
  }
  
  const projectLimit = isUserPro
    ? SUBSCRIPTION_PLAN_LIMITS.pro
    : (isUserStarter
      ? SUBSCRIPTION_PLAN_LIMITS.starter
      : (subscriptionData?.plan_type === 'pro' 
        ? SUBSCRIPTION_PLAN_LIMITS.pro
        : (subscriptionData?.plan_type === 'starter' || subscriptionData?.plan_type === 'standard'
          ? SUBSCRIPTION_PLAN_LIMITS.starter
          : SUBSCRIPTION_PLAN_LIMITS.trial)));

  const [currentProjectCount, setCurrentProjectCount] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProjectCount = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setIsRefreshing(true);
      setFetchError(null);
      
      console.log(`Fetching project count for user: ${session.user.id}`);
      
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log(`Project count result: ${count}`);
      setCurrentProjectCount(count || 0);
      
      console.log(`Project limits: ${count || 0}/${projectLimit}`);
    } catch (error) {
      console.error('Error fetching project count:', error);
      setFetchError(error as Error);
      
      try {
        const cachedCount = localStorage.getItem('projectCount');
        if (cachedCount) {
          setCurrentProjectCount(parseInt(cachedCount, 10));
          console.log(`Using cached project count: ${cachedCount}`);
        }
      } catch (e) {
        console.error('Error reading cached project count:', e);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [session, projectLimit]);

  useEffect(() => {
    if (currentProjectCount !== null) {
      try {
        localStorage.setItem('projectCount', currentProjectCount.toString());
      } catch (e) {
        console.error('Error caching project count:', e);
      }
    }
  }, [currentProjectCount]);

  useEffect(() => {
    if (session?.user) {
      fetchProjectCount();
    }
  }, [session, fetchProjectCount]);
  
  useEffect(() => {
    if (!subscriptionLoading && subscriptionData) {
      fetchProjectCount();
    }
  }, [subscriptionData, subscriptionLoading, fetchProjectCount]);

  const handleFileUpload = useCallback(async (file: File, deadline?: Date) => {
    if (!session?.user) {
      toast.error("Please sign in to upload RFPs");
      return;
    }
    
    await fetchProjectCount();
    
    if (currentProjectCount !== null && projectLimit !== null && currentProjectCount >= projectLimit) {
      toast.error(`Project limit reached (${currentProjectCount}/${projectLimit})`, { 
        description: "Please delete some projects or upgrade your plan."
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 7);
      const fileName = `${timestamp}-${randomId}-${file.name}`;
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('rfp-files')
        .upload(fileName, file);

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
      
      const newProject = {
        project_id: uuidv4(),
        user_id: session.user.id,
        title: file.name.replace(/\.[^/.]+$/, ""),
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
      
      setProjectId(project.project_id);
      setProjectTitle(project.title);
      
      setUploadProgress(90);
      
      fetchProjectCount();
      
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      setUploadProgress(100);
      toast.success("RFP uploaded successfully");
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error.message || "Please try again.",
      });
    } finally {
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
    isRefreshing,
    setProjectTitle,
    handleFileUpload,
    updateProject,
    fetchProjectCount
  };
};
