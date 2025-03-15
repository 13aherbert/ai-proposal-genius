import { Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network";
import { getUserRolesFromStorage } from "@/hooks/use-user-roles";
import { withRetry } from "@/utils/network/retry";

export function LoadingState() {
  const [retryCount, setRetryCount] = useState(0);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const [loadedFromLocal, setLoadedFromLocal] = useState(false);
  const [hasUserRoles, setHasUserRoles] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const isAttempting = useRef(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const cachedTokenRef = useRef<string | null>(localStorage.getItem('userToken'));
  const progressTimeout = useRef<number | null>(null);
  const maxLoadTime = 20; // seconds before allowing user to proceed anyway

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        if (newTime === 3) {
          setLoadingTooLong(true);
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-progress to dashboard if taking too long
  useEffect(() => {
    if (loadingTime >= maxLoadTime && !progressTimeout.current) {
      console.log("Loading subscription is taking too long, preparing to auto-progress");
      
      progressTimeout.current = window.setTimeout(() => {
        console.log("Maximum load time exceeded, redirecting to dashboard");
        tryLoadingFromCache();
        
        // Dispatch event to signal we're skipping subscription loading
        window.dispatchEvent(new CustomEvent('skipSubscriptionLoading', { 
          detail: { reason: 'timeout' } 
        }));
        
        // Redirect to dashboard after showing toast
        toast.info("Proceeding to dashboard", {
          description: "Subscription data will continue loading in background",
          duration: 3000,
        });
        
        window.location.href = '/dashboard';
      }, 2000);
    }
    
    return () => {
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
      }
    };
  }, [loadingTime]);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const start = Date.now();
        await fetch("https://bmopbbkfxkgzlbmhhgox.supabase.co/auth/v1/health", {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          signal: AbortSignal.timeout(2000)
        });
        const end = Date.now();
        
        setNetworkStatus('online');
        
        if (end - start > 500) {
          console.log(`Network latency is high: ${end - start}ms`);
        }
      } catch (e) {
        console.error("Network check failed:", e);
        setNetworkStatus('offline');
        setNetworkError(true);
        
        tryLoadingFromCache();
      }
    };
    
    checkNetwork();
    
    const intervalId = setInterval(checkNetwork, 15000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try {
      const userToken = localStorage.getItem('userToken');
      if (userToken) {
        console.log("Found stored auth token");
        
        if (!supabase.auth.getSession()) {
          console.log("No active session but token found, attempting to initialize");
          supabase.auth.setSession({
            access_token: userToken,
            refresh_token: '',
          }).catch(err => {
            console.error("Error initializing session from stored token:", err);
          });
        }
      }
      
      const userRoles = getUserRolesFromStorage();
      if (userRoles) {
        console.log("Found cached user roles:", userRoles);
        setHasUserRoles(true);
      }
      
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.subscription_id) {
          console.log("Found cached subscription data");
          setLocalDataLoaded(true);
          
          window.dispatchEvent(new CustomEvent('subscriptionCacheLoaded', { 
            detail: { data: parsedData } 
          }));
          setLoadedFromLocal(true);
        }
      }
    } catch (e) {
      console.error("Error checking local storage:", e);
    }
  }, []);

  useEffect(() => {
    const handleCacheLoaded = (event: CustomEvent) => {
      console.log("Received subscriptionCacheLoaded event");
      setLoadedFromLocal(true);
    };
    
    const handleDataLoaded = (event: CustomEvent) => {
      console.log("Received subscriptionLoaded event");
      setLoadedFromLocal(true);
    };
    
    window.addEventListener('subscriptionCacheLoaded', handleCacheLoaded as EventListener);
    window.addEventListener('subscriptionLoaded', handleDataLoaded as EventListener);
    
    // Listen for skip event from parent components
    const handleSkipLoading = () => {
      console.log("Received skipSubscriptionLoading event");
      setLoadedFromLocal(true);
    };
    
    window.addEventListener('skipSubscriptionLoading', handleSkipLoading);
    
    return () => {
      window.removeEventListener('subscriptionCacheLoaded', handleCacheLoaded as EventListener);
      window.removeEventListener('subscriptionLoaded', handleDataLoaded as EventListener);
      window.removeEventListener('skipSubscriptionLoading', handleSkipLoading);
    };
  }, []);

  useEffect(() => {
    if (isAttempting.current || retryCount > 2 || loadedFromLocal) return;
    
    const timeoutId = setTimeout(() => {
      fetchSubscriptionDirect();
      setRetryCount(prev => prev + 1);
    }, retryCount === 0 ? 1000 : 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [retryCount, loadedFromLocal]);

  const fetchSubscriptionDirect = async () => {
    if (isAttempting.current) return;
    
    try {
      isAttempting.current = true;
      
      const authToken = localStorage.getItem('userToken') || cachedTokenRef.current;
      let userId = null;
      let sessionHeaders = {};
      
      if (authToken) {
        console.log("Using stored auth token for subscription fetch");
        sessionHeaders = {
          Authorization: `Bearer ${authToken}`
        };
        
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser(authToken);
          if (!userError && userData?.user) {
            userId = userData.user.id;
            console.log("Retrieved user ID from token:", userId);
          }
        } catch (e) {
          console.error("Error getting user from token:", e);
        }
      }
      
      if (!userId) {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Session fetch timed out")), 2000);
        });
        
        const { data: sessionData, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isNetworkError(sessionError)) {
            setNetworkError(true);
            setNetworkStatus('offline');
            toast.error(getNetworkErrorMessage(sessionError));
          }
          tryLoadingFromCache();
          return;
        }
        
        if (!sessionData?.session?.user?.id) {
          console.log("No authenticated user found for direct subscription fetch");
          isAttempting.current = false;
          return;
        }
        
        userId = sessionData.session.user.id;
        
        if (sessionData?.session?.access_token) {
          localStorage.setItem('userToken', sessionData.session.access_token);
          cachedTokenRef.current = sessionData.session.access_token;
        }
      }
      
      if (!userId) {
        console.log("Could not determine user ID for subscription fetch");
        isAttempting.current = false;
        return;
      }
      
      console.log("Attempting direct subscription fetch from database for user", userId);
      
      const fetchPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      const fetchTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database fetch timed out")), 3000);
      });
      
      const { data, error } = await Promise.race([
        fetchPromise,
        fetchTimeoutPromise
      ]) as any;
          
      if (error) {
        console.error("Error in direct subscription fetch:", error);
        setErrorOccurred(true);
        
        if (isNetworkError(error)) {
          setNetworkError(true);
          setNetworkStatus('offline');
          toast.error(getNetworkErrorMessage(error));
        }
        
        tryLoadingFromCache();
      } else if (data) {
        console.log("Successfully fetched subscription data directly");
        
        try {
          const typedData: SubscriptionPlan = {
            ...data,
            status: data.status as SubscriptionStatus,
            features: typeof data.features === 'object' && data.features !== null 
              ? data.features as Record<string, any> 
              : {}
          };
          typedData.updated_at = new Date().toISOString();
          localStorage.setItem('subscriptionData', JSON.stringify(typedData));
          
          window.dispatchEvent(new CustomEvent('subscriptionLoaded', { 
            detail: { data: typedData } 
          }));
          
          setLoadedFromLocal(true);
          toast.success("Subscription data loaded", { duration: 2000 });
        } catch (e) {
          console.error("Error storing subscription data locally:", e);
        }
      } else {
        createDefaultSubscription(userId);
      }
      
      if (!hasUserRoles && authToken) {
        try {
          const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles', {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          if (roleError) {
            console.error("Error fetching user roles:", roleError);
            
            const { data: fallbackRoleData, error: fallbackRoleError } = await supabase.functions.invoke('get-user-roles', {
              body: { token: authToken }
            });
            
            if (!fallbackRoleError && fallbackRoleData?.roles) {
              console.log("Successfully fetched user roles with fallback method");
              localStorage.setItem('userRoles', JSON.stringify(fallbackRoleData.roles));
              setHasUserRoles(true);
            }
          } else if (roleData?.roles) {
            console.log("Successfully fetched user roles");
            localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
            setHasUserRoles(true);
          }
        } catch (roleErr) {
          console.error("Exception fetching user roles:", roleErr);
        }
      }
    } catch (err) {
      console.error("Exception in direct subscription fetch:", err);
      setErrorOccurred(true);
      
      if (isNetworkError(err)) {
        setNetworkError(true);
        setNetworkStatus('offline');
        toast.error(getNetworkErrorMessage(err), {
          description: "Using cached data if available"
        });
      } else {
        toast.error("Could not load subscription data");
      }
      
      tryLoadingFromCache();
    } finally {
      isAttempting.current = false;
    }
  };

  const tryLoadingFromCache = () => {
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.subscription_id) {
          console.log("Loading subscription from cache due to fetch failure");
          window.dispatchEvent(new CustomEvent('subscriptionCacheLoaded', { 
            detail: { data: parsedData } 
          }));
          setLoadedFromLocal(true);
        }
      }
    } catch (e) {
      console.error("Error loading from cache:", e);
    }
  };

  const createDefaultSubscription = (userId: string) => {
    console.log("No subscription found, creating default trial");
    
    const defaultTrial: SubscriptionPlan = {
      subscription_id: crypto.randomUUID(),
      user_id: userId,
      status: 'trialing',
      plan_type: 'trial',
      project_limit: 3,
      features: {},
      current_period_end: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('subscriptionData', JSON.stringify(defaultTrial));
      window.dispatchEvent(new CustomEvent('subscriptionLoaded', { 
        detail: { data: defaultTrial } 
      }));
      setLoadedFromLocal(true);
    } catch (e) {
      console.error("Error storing default trial data:", e);
    }
    
    toast.info("Setting up your account...");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSkipAndProceed = () => {
    // Try loading from cache first
    tryLoadingFromCache();
    
    // Dispatch event to signal we're skipping
    window.dispatchEvent(new CustomEvent('skipSubscriptionLoading', { 
      detail: { reason: 'userRequested' } 
    }));
    
    // Redirect to dashboard
    toast.info("Proceeding to dashboard", {
      description: "Subscription data will continue loading in the background"
    });
    
    // Slight delay to show toast
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription... {loadingTime > 2 ? `(${loadingTime}s)` : ''}</p>
      
      {networkStatus !== 'checking' && (
        <div className="flex items-center text-sm mt-2 mb-4">
          {networkStatus === 'online' ? (
            <>
              <Wifi className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500">Offline</span>
            </>
          )}
        </div>
      )}
      
      {loadingTooLong && !errorOccurred && !networkError && (
        <p className="text-muted-foreground mt-2 text-sm">
          This is taking longer than usual. Please wait...
        </p>
      )}
      
      {(networkError || loadingTime > 5) && (
        <div className="mt-4 text-center max-w-md">
          <p className="text-muted-foreground text-sm">
            {networkError ? 
              "Network connectivity issues detected. We're using cached data if available." :
              "Loading is taking longer than expected. You can try refreshing the page."}
          </p>
          <div className="flex space-x-2 justify-center mt-2">
            <button 
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90 flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </button>
            {loadingTime > 5 && (
              <button
                onClick={handleSkipAndProceed}
                className="mt-2 px-4 py-2 bg-primary/80 text-white rounded-md text-sm hover:bg-primary"
              >
                Continue to Dashboard
              </button>
            )}
            {loadingTime > 10 && (
              <button
                onClick={() => {
                  localStorage.removeItem('userToken');
                  localStorage.removeItem('userRoles');
                  window.location.href = '/';
                }}
                className="mt-2 px-4 py-2 bg-destructive/70 text-white rounded-md text-sm hover:bg-destructive/90"
              >
                Reset & Sign In Again
              </button>
            )}
          </div>
        </div>
      )}
      
      {(localDataLoaded || hasUserRoles) && (loadingTooLong || errorOccurred || networkError) && (
        <p className="text-muted-foreground mt-4 text-sm">
          Using cached user data while connecting...
        </p>
      )}
    </div>
  );
}
