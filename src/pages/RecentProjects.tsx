
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { getSafeProjectLimit } from "@/hooks/subscription/feature-access";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export default function RecentProjects() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const { checkSubscription, data: subscriptionData, isLoading: subscriptionLoading } = useSubscription();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [projectLimitApplied, setProjectLimitApplied] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      setAuthReady(true);
    }
  }, [loading]);
  
  // Ensure subscription data is fresh on component mount
  useEffect(() => {
    if (session?.user && !initialLoadComplete) {
      console.log("RecentProjects: Initial mount, checking subscription data");
      checkSubscription(true); // Force a refresh to ensure we have the latest data
      setInitialLoadComplete(true);
    }
  }, [session, checkSubscription, initialLoadComplete]);
  
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
  
  const { hasFeature, plan, getProjectLimit } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  // Enhanced project limit handling
  const handleProjectLimitUpdate = () => {
    if (subscriptionData) {
      // Get the correct limit based on plan type, with a fallback to the stored limit
      const safeLimit = getSafeProjectLimit(
        subscriptionData.plan_type,
        subscriptionData.project_limit
      );
      
      // Defensively handle plan types
      const normalizedPlan = (subscriptionData.plan_type || '').toLowerCase();
      
      // For starter plans, ensure we always use 10 as the limit
      if (normalizedPlan === 'starter' && safeLimit !== 10) {
        console.log(`Correcting starter plan project limit from ${safeLimit} to 10`);
        updateProjectLimit(10);
        return 10;
      }
      
      // If the current project limit doesn't match the safe limit, update it
      if (projectLimit !== safeLimit) {
        console.log(`Updating project limit from ${projectLimit} to ${safeLimit}`);
        updateProjectLimit(safeLimit);
      }
      
      return safeLimit;
    }
    
    // Default to trial limit if no subscription data
    return 3;
  };
  
  // Apply project limit when subscription data changes
  useEffect(() => {
    if (subscriptionData && !subscriptionLoading && !projectLimitApplied) {
      console.log(`Current plan: ${subscriptionData.plan_type} with stored project limit: ${subscriptionData.project_limit}`);
      
      // Apply the correct project limit
      const correctLimit = handleProjectLimitUpdate();
      
      console.log(`Applied project limit: ${correctLimit}`);
      setProjectLimitApplied(true);
      
      // If we applied a different limit, refetch projects
      if (correctLimit !== projectLimit) {
        setTimeout(() => {
          console.log('Refetching projects after updating project limit');
          refetch();
        }, 500);
      }
    }
  }, [subscriptionData, subscriptionLoading, projectLimit, projectLimitApplied]);
  
  // Reset the applied flag when subscription data changes
  useEffect(() => {
    if (subscriptionData) {
      setProjectLimitApplied(false);
    }
  }, [subscriptionData?.subscription_id]);

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
  
  // Show loading state while we're waiting for authentication to complete
  if (loading) {
    return (
      <div className="container py-10 space-y-8">
        <div className="flex justify-center items-center h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your authentication...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show auth required message if not authenticated
  if (!session?.user) {
    return (
      <div className="container py-10 space-y-8">
        <div className="flex justify-center items-center h-[400px]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 border rounded-lg bg-muted/20">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">You need to be signed in to view your projects.</p>
            <Button onClick={() => navigate("/")} className="mt-2">
              Return to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get a safe project limit for displaying even while subscription is loading
  const displayProjectLimit = subscriptionData 
    ? getSafeProjectLimit(subscriptionData.plan_type, subscriptionData.project_limit)
    : projectLimit || 3;

  return (
    <div className="container py-10 space-y-8">
      <ProjectsHeader 
        canCreateProject={canCreateProject} 
        currentPlanLimit={displayProjectLimit} 
        projectCount={projectCount}
        isSubscriptionLoading={subscriptionLoading}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
        <div className="flex flex-col items-center justify-center p-10 bg-muted/40 rounded-lg h-[400px] text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">No projects yet</h3>
            <p className="text-muted-foreground">
              Create your first project to start generating proposal drafts and analyzing RFPs.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your current plan allows up to {displayProjectLimit} projects.
            </p>
          </div>
          <Button onClick={() => navigate("/upload-rfp")}>
            Create a Project
          </Button>
        </div>
      )}
    </div>
  );
}
