import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsLoadingState } from "@/components/projects/ProjectsLoadingState";
import { ProjectsAuthError } from "@/components/projects/ProjectsAuthError";
import { ProjectsToolbar } from "@/components/projects/ProjectsToolbar";
import { ProjectsEmptyState } from "@/components/projects/ProjectsEmptyState";
import { useProjectLimits } from "@/hooks/use-project-limits";

export default function RecentProjects() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const { data: subscriptionData, isLoading: subscriptionLoading, checkSubscription } = useSubscription();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const hasRunInitialChecksRef = useRef(false);
  const userTokenRef = useRef<string | null>(localStorage.getItem('userToken'));
  
  // Set auth ready when authentication loading is complete or we have a cached token
  useEffect(() => {
    if (!loading || userTokenRef.current) {
      setAuthReady(true);
    }
  }, [loading]);
  
  // Project limits logic from the new hook
  const {
    forceStarterPlan,
    projectLimitApplied,
    setProjectLimitApplied,
    getProjectLimit,
    determineDisplayLimit
  } = useProjectLimits(authReady ? session?.user || null : null);
  
  // Initial subscription check - only run once and with fast timeout
  useEffect(() => {
    if (!session?.user || initialLoadComplete || hasRunInitialChecksRef.current) return;
    
    const timer = setTimeout(() => {
      // Set a timeout for the subscription check
      Promise.race([
        checkSubscription(),
        new Promise((resolve) => setTimeout(resolve, 2000)) // 2 second timeout
      ]).catch(err => {
        console.error("Error or timeout checking subscription:", err);
      }).finally(() => {
        setInitialLoadComplete(true);
      });
      
      hasRunInitialChecksRef.current = true;
    }, 500); // Reduced from 1000ms to 500ms
    
    return () => clearTimeout(timer);
  }, [session?.user?.id, checkSubscription, initialLoadComplete]);
  
  const { 
    projects, 
    isLoading, 
    error, 
    deleteProject, 
    exportProjects,
    canCreateProject,
    pagination,
    projectCount,
    projectLimit,
    refetch,
    updateProjectLimit
  } = useProjects(authReady ? session?.user || null : null);
  
  const { hasFeature, refreshSubscription } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  // Apply project limit when subscription data is available - with faster checking
  useEffect(() => {
    // Skip if already applied or no user
    if (projectLimitApplied || (!session?.user && !userTokenRef.current)) return;
    
    // Skip if subscription is still loading and we don't have forced starter plan
    if (!subscriptionData && !forceStarterPlan) return;
    
    const correctLimit = getProjectLimit();
    if (correctLimit && correctLimit !== projectLimit) {
      updateProjectLimit(correctLimit);
      setProjectLimitApplied(true);
      
      // Faster refetch
      setTimeout(() => {
        refetch();
      }, 300); // Reduced from 1000ms to 300ms
    }
  }, [
    subscriptionData, 
    projectLimit, 
    projectLimitApplied, 
    forceStarterPlan, 
    session?.user, 
    getProjectLimit, 
    updateProjectLimit, 
    setProjectLimitApplied, 
    refetch
  ]);
  
  // Reset project limit flag when subscription ID changes
  useEffect(() => {
    if (subscriptionData && subscriptionData.subscription_id) {
      setProjectLimitApplied(false);
    }
  }, [subscriptionData?.subscription_id]);
  
  // Set page to 1 on initial load
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, []);
  
  const handleExport = async () => {
    if (hasExportFeature) {
      await exportProjects();
    } else {
      navigate("/subscription?feature=data_export");
    }
  };
  
  const handleManualRefresh = () => {
    toast.info("Refreshing subscription data...");
    localStorage.removeItem("projectLimit");
    
    try {
      if (window.featureCache && typeof window.featureCache.clear === 'function') {
        window.featureCache.clear();
      }
      if (window.projectLimitCache && typeof window.projectLimitCache.clear === 'function') {
        window.projectLimitCache.clear();
      }
    } catch (e) {
      console.error("Error clearing feature caches:", e);
    }
    
    refreshSubscription();
    setRefreshAttempts(prev => prev + 1);
    setProjectLimitApplied(false);
    hasRunInitialChecksRef.current = false;
    
    setTimeout(() => {
      refetch();
    }, 500); // Reduced from 1000ms to 500ms
  };
  
  // If we have a cached token but auth is still loading, show content with cached data
  const shouldSkipLoadingState = userTokenRef.current && loading && authReady;
  
  // Show loading state while authentication is being verified
  if (loading && !shouldSkipLoadingState) {
    return (
      <div className="container py-10 space-y-8">
        <ProjectsLoadingState message="Verifying your authentication..." />
      </div>
    );
  }
  
  // Show error if user is not authenticated
  if (!session?.user && !userTokenRef.current) {
    return <ProjectsAuthError />;
  }

  // Calculate final display limit with extra safety checks
  const displayProjectLimit = determineDisplayLimit(projectLimit);

  return (
    <div className="container py-10 space-y-8">
      <ProjectsToolbar 
        canCreateProject={canCreateProject}
        displayProjectLimit={displayProjectLimit}
        projectCount={projectCount}
        isSubscriptionLoading={subscriptionLoading}
        onRefresh={handleManualRefresh}
      />

      {isLoading ? (
        <ProjectsLoadingState />
      ) : error ? (
        <ProjectsError onRetry={refetch} />
      ) : projects && projects.length > 0 ? (
        <ProjectsTable 
          projects={projects} 
          onDelete={deleteProject}
          onExport={handleExport}
          pagination={pagination}
        />
      ) : (
        <ProjectsEmptyState projectLimit={displayProjectLimit} />
      )}
    </div>
  );
}
