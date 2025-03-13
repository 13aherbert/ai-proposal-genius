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
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVEL: LogLevel = 'error'; // Can be 'debug', 'info', 'warn', 'error'

// Helper function to conditionally log based on level
const conditionalLog = (level: LogLevel, ...args: any[]) => {
  const logLevelMap = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // Only log if the current level is greater than or equal to the configured level
  if (logLevelMap[level] >= logLevelMap[LOG_LEVEL]) {
    console[level](...args);
  }
};

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
  const lastProjectLimitUpdateTime = useRef<number>(0);
  const isStarterUserRef = useRef<boolean | null>(null);
  
  useEffect(() => {
    if (!loading) {
      setAuthReady(true);
    }
  }, [loading]);
  
  // Initialize starter user check - run this only once
  useEffect(() => {
    if (hasRunInitialChecksRef.current || !session?.user) return;
    
    const isUserStarter = session?.user?.id === STARTER_USER_ID || isStarterUser();
    isStarterUserRef.current = isUserStarter;
    
    if (isUserStarter) {
      conditionalLog('info', "*** DETECTED STARTER PLAN USER - FORCING STARTER PLAN SETTINGS ***");
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
        conditionalLog('info', "Created starter plan backup in localStorage");
      } catch (e) {
        conditionalLog('error', "Failed to create starter plan backup", e);
      }
      
      try {
        sessionStorage.setItem('userIsStarter', 'true');
        localStorage.setItem('userIsStarter', 'true');
        localStorage.setItem('projectLimit', SUBSCRIPTION_PLAN_LIMITS.starter.toString());
      } catch (e) {
        conditionalLog('error', "Failed to store starter flags in storage", e);
      }
    }
    
    hasRunInitialChecksRef.current = true;
  }, [session?.user?.id]);
  
  // Initial subscription check - only run once
  useEffect(() => {
    if (!session?.user || initialLoadComplete || hasRunInitialChecksRef.current) return;
    
    conditionalLog('info', "RecentProjects: Initial mount, checking subscription data");
    const timer = setTimeout(() => {
      checkSubscription(true).catch(err => {
        conditionalLog('error', "Error checking subscription:", err);
      });
      setInitialLoadComplete(true);
    }, 1000);
    
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
  
  const { hasFeature, plan, getProjectLimit, refreshSubscription } = useSubscriptionFeatures();
  const hasExportFeature = hasFeature("data_export");
  
  const handleProjectLimitUpdate = () => {
    // Debounce project limit updates to prevent rapid consecutive updates
    const now = Date.now();
    if (now - lastProjectLimitUpdateTime.current < 5000) {
      conditionalLog('info', "Skipping project limit update - too soon since last update");
      return projectLimit; // Return current limit without updates
    }
    
    lastProjectLimitUpdateTime.current = now;
    
    if (forceStarterPlan || isStarterUserRef.current || isStarterUser()) {
      conditionalLog('info', "CRITICAL: Forcing starter plan limit to 10 projects");
      if (projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
        updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
      }
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    if (subscriptionData) {
      conditionalLog('debug', "Current subscription data:", subscriptionData);
      
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      
      if (normalizedPlan === 'starter') {
        conditionalLog('info', `CRITICAL: Starter plan detected, ENFORCING ${SUBSCRIPTION_PLAN_LIMITS.starter} projects limit (stored: ${subscriptionData.project_limit})`);
        if (projectLimit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
          updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
        }
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      } else if (normalizedPlan === 'pro') {
        return SUBSCRIPTION_PLAN_LIMITS.pro;
      } else if (normalizedPlan === 'trial') {
        return SUBSCRIPTION_PLAN_LIMITS.trial;
      }
      
      const safeLimit = getSafeProjectLimit(
        normalizedPlan,
        subscriptionData.project_limit
      );
      
      conditionalLog('debug', `Plan type: ${normalizedPlan}, Safe limit: ${safeLimit}, Current limit: ${projectLimit}`);
      
      if (projectLimit !== safeLimit) {
        updateProjectLimit(safeLimit);
      }
      
      return safeLimit;
    }
    
    // Fallback checks without a full subscription record
    if (forceStarterPlan || isStarterUserRef.current || isStarterUser()) {
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const { data } = JSON.parse(storedData);
        if (data && normalizePlanType(data.plan_type) === 'starter') {
          conditionalLog('info', 'Using stored starter plan data from localStorage');
          return SUBSCRIPTION_PLAN_LIMITS.starter;
        }
      }
      
      if (localStorage.getItem('userIsStarter') === 'true' || 
          sessionStorage.getItem('userIsStarter') === 'true') {
        conditionalLog('info', 'Found userIsStarter flag, using starter plan limit');
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      const storedLimit = localStorage.getItem('projectLimit');
      if (storedLimit === `${SUBSCRIPTION_PLAN_LIMITS.starter}`) {
        conditionalLog('info', 'Found projectLimit=10 in localStorage, using starter plan limit');
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
    } catch (e) {
      conditionalLog('error', 'Error checking localStorage:', e);
    }
    
    return SUBSCRIPTION_PLAN_LIMITS.trial;
  };
  
  // Apply project limit when subscription data is available - throttled to not run too often
  useEffect(() => {
    // Skip if already applied or no user
    if (projectLimitApplied || !session?.user) return;
    
    // Skip if subscription is still loading and we don't have forced starter plan
    if (!subscriptionData && !forceStarterPlan && !isStarterUserRef.current) return;
    
    // Debounce updates
    const now = Date.now();
    if (now - lastProjectLimitUpdateTime.current < 5000) {
      return;
    }
    
    conditionalLog('info', "Applying project limit...");
    
    if (forceStarterPlan || isStarterUserRef.current || isStarterUser()) {
      conditionalLog('info', "Applying forced starter plan limit");
      updateProjectLimit(SUBSCRIPTION_PLAN_LIMITS.starter);
      setProjectLimitApplied(true);
      return;
    }
    
    if (subscriptionData) {
      conditionalLog('debug', `Current plan: ${subscriptionData.plan_type} with stored project limit: ${subscriptionData.project_limit}`);
      
      const correctLimit = handleProjectLimitUpdate();
      
      conditionalLog('debug', `Applied project limit: ${correctLimit}`);
      setProjectLimitApplied(true);
      
      if (correctLimit !== projectLimit) {
        setTimeout(() => {
          conditionalLog('info', 'Refetching projects after updating project limit');
          refetch();
        }, 1000);
      }
    } else {
      const forceUpdateLimit = handleProjectLimitUpdate();
      if (forceUpdateLimit !== projectLimit) {
        conditionalLog('info', `Forcing update to project limit: ${forceUpdateLimit}`);
        updateProjectLimit(forceUpdateLimit);
        setProjectLimitApplied(true);
      }
    }
  }, [subscriptionData, projectLimit, projectLimitApplied, forceStarterPlan, session?.user]);
  
  // Reset project limit flag when subscription ID changes
  useEffect(() => {
    if (subscriptionData && subscriptionData.subscription_id) {
      setProjectLimitApplied(false);
    }
  }, [subscriptionData?.subscription_id]);
  
  // If we've initialized everything, log the current state once
  useEffect(() => {
    if (!hasRunInitialChecksRef.current || !session?.user) return;
    
    const planFromSubscriptionData = subscriptionData?.plan_type ? normalizePlanType(subscriptionData.plan_type) : null;
    const displayProjectLimit = (forceStarterPlan || isStarterUserRef.current || isStarterUser()) ? 
      SUBSCRIPTION_PLAN_LIMITS.starter : 
      (subscriptionData ? getSafeProjectLimit(subscriptionData.plan_type, subscriptionData.project_limit) : 
      projectLimit || SUBSCRIPTION_PLAN_LIMITS.trial);
    
    conditionalLog('info', "Current subscription state:", {
      plan: planFromSubscriptionData,
      status: subscriptionData?.status,
      projectLimit: subscriptionData?.project_limit,
      displayLimit: displayProjectLimit,
      currentCount: projectCount,
      forceStarterPlan
    });
  }, [
    session?.user, 
    forceStarterPlan, 
    subscriptionData, 
    projectLimit, 
    projectCount, 
    projectLimitApplied
  ]);
  
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
      conditionalLog('info', "Feature caches cleared");
    } catch (e) {
      conditionalLog('error', "Error clearing feature caches:", e);
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

  let displayProjectLimit = (forceStarterPlan || isStarterUserRef.current || isStarterUser()) ? SUBSCRIPTION_PLAN_LIMITS.starter : (
    subscriptionData 
      ? getSafeProjectLimit(subscriptionData.plan_type, subscriptionData.project_limit)
      : projectLimit || SUBSCRIPTION_PLAN_LIMITS.trial
  );
    
  const planFromSubscriptionData = subscriptionData?.plan_type ? normalizePlanType(subscriptionData.plan_type) : null;
  if (planFromSubscriptionData === 'starter' || forceStarterPlan || isStarterUserRef.current || isStarterUser()) {
    displayProjectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
  }

  conditionalLog('debug', "Project limits:", `${projectCount}/${displayProjectLimit}`);

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
