
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
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export default function RecentProjects() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const { checkSubscription, data: subscriptionData } = useSubscription();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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
    refetch
  } = useProjects(authReady ? session?.user || null : null);
  
  const { hasFeature, plan, getProjectLimit } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  // Get the correct project limit directly from useSubscriptionFeatures
  const correctProjectLimit = getProjectLimit();
  
  useEffect(() => {
    // Only run this effect when data is available
    if (plan && subscriptionData && !isLoading) {
      console.log(`Current plan: ${plan} with project limit: ${correctProjectLimit}`);
      console.log(`Subscription data from context:`, subscriptionData);
      
      if (subscriptionData) {
        console.log(`Stored project limit in subscription: ${subscriptionData.project_limit}`);
      }
      
      // Check for project limit mismatch and handle it
      if (projectLimit !== correctProjectLimit) {
        console.log(`Project limit mismatch: ${projectLimit} vs ${correctProjectLimit}`);
        
        // If we're on a starter plan but seeing a trial limit, force a refresh
        if (plan === 'starter' && projectLimit === 3) {
          console.log('Starter plan has wrong limit (3), forcing subscription refresh');
          toast.info("Refreshing subscription data to update project limits");
          checkSubscription(true);
          
          // Allow time for subscription update to complete before refetching projects
          setTimeout(() => {
            console.log('Refetching projects after subscription refresh');
            refetch();
          }, 1500);
        }
      }
    }
  }, [plan, projectLimit, correctProjectLimit, checkSubscription, refetch, subscriptionData, isLoading]);

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

  return (
    <div className="container py-10 space-y-8">
      <ProjectsHeader 
        canCreateProject={canCreateProject} 
        currentPlanLimit={correctProjectLimit} 
        projectCount={projectCount}
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
              Your current plan allows up to {correctProjectLimit} projects.
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
