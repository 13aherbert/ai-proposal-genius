import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { getSafeProjectLimit, normalizePlanType, isStarterUser } from "@/hooks/subscription/feature-access";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";

const STARTER_USER_ID = "315f2366-4b3e-4c20-83bf-e59d5b80ad4c";

export default function RecentProjects() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const { checkSubscription, data: subscriptionData, isLoading: subscriptionLoading } = useSubscription();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [projectLimitApplied, setProjectLimitApplied] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [forceStarterPlan, setForceStarterPlan] = useState(false);
  const hasRunInitialChecksRef = useRef(false);
  
  useEffect(() => {
    if (!loading) {
      setAuthReady(true);
    }
  }, [loading]);
  
  useEffect(() => {
    if (hasRunInitialChecksRef.current) return;
    
    const isUserStarter = session?.user?.id === STARTER_USER_ID || isStarterUser();
    
    if (isUserStarter) {
      console.log("*** DETECTED STARTER PLAN USER - FORCING STARTER PLAN SETTINGS ***");
      setForceStarterPlan(true);
      
      const starterBackup = {
        plan_type: 'starter',
        project_limit: SUBSCRIPTION_PLAN_LIMITS.starter,
        status: 'active',
        user_id: session?.user?.id
      };
      
      try {
        localStorage.setItem('subscriptionData', JSON.stringify({
          data: starterBackup,
          timestamp: Date.now()
        }));
        console.log("Created starter plan backup in localStorage");
      } catch (e) {
        console.error("Failed to create starter plan backup", e);
      }
      
      try {
        sessionStorage.setItem('userIsStarter', 'true');
        localStorage.setItem('userIsStarter', 'true');
        localStorage.setItem('projectLimit', SUBSCRIPTION_PLAN_LIMITS.starter.toString());
      } catch (e) {
        console.error("Failed to store starter flags in storage", e);
      }
      
      hasRunInitialChecksRef.current = true;
    }
  }, [session]);
  
  useEffect(() => {
    if (session?.user && !initialLoadComplete && !hasRunInitialChecksRef.current) {
      console.log("RecentProjects: Initial mount, checking subscription data");
      setTimeout(() => {
        checkSubscription(true);
        setInitialLoadComplete(true);
        hasRunInitialChecksRef.current = true;
      }, 500);
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
  
  const { hasFeature, plan, getProjectLimit, refreshSubscription } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  const handleProjectLimitUpdate = () => {
    if (forceStarterPlan || isStarterUser()) {
      console.log("CRITICAL: Forcing starter plan limit to 10 projects");
      if (projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
        updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
      }
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    if (subscriptionData) {
      console.log("Current subscription data:", subscriptionData);
      
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      
      if (normalizedPlan === 'starter') {
        console.log(`CRITICAL: Starter plan detected, enforcing ${SUBSCRIPTION_PLAN_LIMITS.starter} project limit (stored: ${subscriptionData.project_limit})`);
        if (projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          console.log(`Updating project limit from ${projectLimit} to ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
          updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
          
          if (refreshAttempts > 2 && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
            toast.info("Subscription refreshed", {
              description: `Your project limit has been updated to ${SUBSCRIPTION_PLAN_LIMITS.starter}`
            });
          }
        }
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      const safeLimit = getSafeProjectLimit(
        normalizedPlan,
        subscriptionData.project_limit
      );
      
      console.log(`Plan type: ${normalizedPlan}, Safe limit: ${safeLimit}, Current limit: ${projectLimit}`);
      
      if (projectLimit !== safeLimit) {
        console.log(`Updating project limit from ${projectLimit} to ${safeLimit}`);
        updateProjectLimit(safeLimit);
      }
      
      return safeLimit;
    }
    
    if (forceStarterPlan || isStarterUser()) {
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const { data } = JSON.parse(storedData);
        if (data && normalizePlanType(data.plan_type) === 'starter') {
          console.log('Using stored starter plan data from localStorage');
          return SUBSCRIPTION_PLAN_LIMITS.starter;
        }
      }
      
      if (localStorage.getItem('userIsStarter') === 'true' || 
          sessionStorage.getItem('userIsStarter') === 'true') {
        console.log('Found userIsStarter flag, using starter plan limit');
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      const storedLimit = localStorage.getItem('projectLimit');
      if (storedLimit === `${SUBSCRIPTION_PLAN_LIMITS.starter}`) {
        console.log('Found projectLimit=10 in localStorage, using starter plan limit');
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }
    
    return SUBSCRIPTION_PLAN_LIMITS.trial;
  };
  
  useEffect(() => {
    if (!projectLimitApplied && (subscriptionData || forceStarterPlan)) {
      console.log("Applying project limit...");
      
      if (forceStarterPlan || isStarterUser()) {
        console.log("Applying forced starter plan limit");
        updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
        setProjectLimitApplied(true);
        return;
      }
      
      if (subscriptionData) {
        console.log(`Current plan: ${subscriptionData.plan_type} with stored project limit: ${subscriptionData.project_limit}`);
        
        const correctLimit = handleProjectLimitUpdate();
        
        console.log(`Applied project limit: ${correctLimit}`);
        setProjectLimitApplied(true);
        
        if (correctLimit !== projectLimit) {
          setTimeout(() => {
            console.log('Refetching projects after updating project limit');
            refetch();
          }, 500);
        }
      } else {
        const forceUpdateLimit = handleProjectLimitUpdate();
        if (forceUpdateLimit > projectLimit) {
          console.log(`Forcing update to project limit: ${forceUpdateLimit}`);
          updateProjectLimit(forceUpdateLimit);
          setProjectLimitApplied(true);
        }
      }
    }
  }, [subscriptionData, projectLimit, projectLimitApplied, forceStarterPlan]);
  
  useEffect(() => {
    if (subscriptionData && subscriptionData.subscription_id) {
      setProjectLimitApplied(false);
    }
  }, [subscriptionData?.subscription_id]);
  
  useEffect(() => {
    if (!projectLimitApplied && (forceStarterPlan || isStarterUser()) && projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
      console.log("FAILSAFE: Forcing limit to 10 for starter user");
      updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
      setProjectLimitApplied(true);
    }
  }, [forceStarterPlan, projectLimit, projectLimitApplied]);
  
  useEffect(() => {
    if (projectLimitApplied) return;
    
    const normalizedPlan = subscriptionData ? normalizePlanType(subscriptionData.plan_type) : null;
    
    if ((normalizedPlan === 'starter' || forceStarterPlan || isStarterUser()) && 
        projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
      console.log(`RECOVERY: Detected stuck project limit for starter plan: ${projectLimit}`);
      
      const recoveryTimeout = setTimeout(() => {
        console.log("Executing recovery refresh for starter plan limit");
        refreshSubscription();
        
        try {
          localStorage.removeItem('projectLimit');
          localStorage.setItem('projectLimit', SUBSCRIPTION_PLAN_LIMITS.starter.toString());
          localStorage.setItem('userIsStarter', 'true');
          sessionStorage.setItem('userIsStarter', 'true');
          
          if (window.featureCache) window.featureCache.clear();
          if (window.projectLimitCache) window.projectLimitCache.clear();
        } catch (e) {
          console.error("Error clearing caches:", e);
        }
        
        updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
        refetch();
        setRefreshAttempts(prev => prev + 1);
        setProjectLimitApplied(true);
      }, 100);
      
      return () => clearTimeout(recoveryTimeout);
    }
  }, [projectLimit, forceStarterPlan, subscriptionData, projectLimitApplied]);
  
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (session?.user && !hasRunInitialChecksRef.current) {
        console.log("Periodic subscription refresh");
        checkSubscription(false);
        hasRunInitialChecksRef.current = true;
      }
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [session, checkSubscription]);
  
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
    localStorage.removeItem("subscriptionData");
    
    if (isStarterUser() || forceStarterPlan || session?.user?.id === STARTER_USER_ID) {
      localStorage.setItem('projectLimit', SUBSCRIPTION_PLAN_LIMITS.starter.toString());
      localStorage.setItem('userIsStarter', 'true');
      sessionStorage.setItem('userIsStarter', 'true');
    }
    
    try {
      if (window.featureCache && typeof window.featureCache.clear === 'function') {
        window.featureCache.clear();
      }
      if (window.projectLimitCache && typeof window.projectLimitCache.clear === 'function') {
        window.projectLimitCache.clear();
      }
      console.log("Feature caches cleared");
    } catch (e) {
      console.error("Error clearing feature caches:", e);
    }
    
    refreshSubscription();
    setRefreshAttempts(prev => prev + 1);
    setProjectLimitApplied(false);
    hasRunInitialChecksRef.current = false;
    
    if (isStarterUser() || forceStarterPlan) {
      updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
    } else if (subscriptionData && normalizePlanType(subscriptionData.plan_type) === 'starter') {
      updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
    }
    
    setTimeout(() => {
      refetch();
    }, 1000);
  };
  
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

  let displayProjectLimit = (forceStarterPlan || isStarterUser()) ? SUBSCRIPTION_PLAN_LIMITS.starter : (
    subscriptionData 
      ? getSafeProjectLimit(subscriptionData.plan_type, subscriptionData.project_limit)
      : projectLimit || SUBSCRIPTION_PLAN_LIMITS.trial
  );
    
  const planFromSubscriptionData = subscriptionData?.plan_type ? normalizePlanType(subscriptionData.plan_type) : null;
  if (planFromSubscriptionData === 'starter' || forceStarterPlan || isStarterUser()) {
    displayProjectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
  }

  if (!hasRunInitialChecksRef.current) {
    console.log("Current subscription state:", {
      plan: planFromSubscriptionData,
      status: subscriptionData?.status,
      projectLimit: subscriptionData?.project_limit,
      displayLimit: displayProjectLimit,
      currentCount: projectCount,
      forceStarterPlan
    });
    hasRunInitialChecksRef.current = true;
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-start">
        <ProjectsHeader 
          canCreateProject={canCreateProject} 
          currentPlanLimit={displayProjectLimit} 
          projectCount={projectCount}
          isSubscriptionLoading={subscriptionLoading}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Limits
        </Button>
      </div>

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
