
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

  // Track loading time
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        // Try to ping Supabase
        const start = Date.now();
        await fetch(`${supabase.supabaseUrl}/auth/v1/health`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        const end = Date.now();
        
        // Network is available
        setNetworkStatus('online');
        
        // If ping took too long, that might explain the loading time
        if (end - start > 1000) {
          console.log(`Network latency is high: ${end - start}ms`);
        }
      } catch (e) {
        console.error("Network check failed:", e);
        setNetworkStatus('offline');
        setNetworkError(true);
      }
    };
    
    checkNetwork();
    
    // Set up periodic network checks
    const intervalId = setInterval(checkNetwork, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // First try to load from localStorage
  useEffect(() => {
    try {
      // Check for stored token
      const userToken = localStorage.getItem('userToken');
      if (userToken) {
        console.log("Found stored auth token");
      }
      
      // Check for stored roles
      const userRoles = getUserRolesFromStorage();
      if (userRoles) {
        console.log("Found cached user roles:", userRoles);
        setHasUserRoles(true);
      }
      
      // Check for stored subscription data
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Verify this is valid subscription data
        if (parsedData.subscription_id) {
          console.log("Found cached subscription data");
          setLocalDataLoaded(true);
          
          // If data is recent (last 24 hours), use it immediately
          const updatedAt = parsedData.updated_at ? new Date(parsedData.updated_at).getTime() : 0;
          const isRecent = Date.now() - updatedAt < 86400000; // 24 hours
          
          if (isRecent) {
            // Dispatch an event that subscription data was loaded from cache
            window.dispatchEvent(new CustomEvent('subscriptionCacheLoaded', { 
              detail: { data: parsedData } 
            }));
            setLoadedFromLocal(true);
          }
        }
      }
    } catch (e) {
      console.error("Error checking local storage:", e);
    }
  }, []);

  // Set up listener for subscription data events
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
    
    return () => {
      window.removeEventListener('subscriptionCacheLoaded', handleCacheLoaded as EventListener);
      window.removeEventListener('subscriptionLoaded', handleDataLoaded as EventListener);
    };
  }, []);

  // Try to directly fetch subscription data if edge function fails
  useEffect(() => {
    if (isAttempting.current || retryCount > 2 || loadedFromLocal) return;
    
    // After 3 seconds try direct fetch
    const timeoutId = setTimeout(() => {
      fetchSubscriptionDirect();
      setRetryCount(prev => prev + 1);
    }, retryCount === 0 ? 3000 : 1000);
    
    // Set a timeout to show "loading too long" message after 5 seconds
    const loadingTooLongId = setTimeout(() => {
      setLoadingTooLong(true);
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(loadingTooLongId);
    };
  }, [retryCount, loadedFromLocal]);

  const fetchSubscriptionDirect = async () => {
    if (isAttempting.current) return;
    
    try {
      isAttempting.current = true;
      
      // Use stored token if available
      const authToken = localStorage.getItem('userToken');
      let authHeaders = {};
      
      if (authToken) {
        console.log("Using stored auth token for subscription fetch");
        authHeaders = {
          Authorization: `Bearer ${authToken}`
        };
      }
      
      // Get the current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Session fetch timed out")), 5000);
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
      
      // Refresh auth token in storage
      if (sessionData?.session?.access_token) {
        localStorage.setItem('userToken', sessionData.session.access_token);
      }
      
      console.log("Attempting direct subscription fetch from database");
      
      // Query the database directly instead of using the edge function
      const fetchPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();
        
      const fetchTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database fetch timed out")), 5000);
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
        
        // Store in localStorage as a fallback with proper typing
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
          
          // Dispatch an event that subscription data was loaded
          window.dispatchEvent(new CustomEvent('subscriptionLoaded', { 
            detail: { data: typedData } 
          }));
          
          setLoadedFromLocal(true);
          toast.success("Subscription data loaded", { duration: 2000 });
        } catch (e) {
          console.error("Error storing subscription data locally:", e);
        }
      } else {
        // Create default trial subscription if no data
        createDefaultSubscription(sessionData.session.user.id);
      }
      
      // Also try to fetch user roles if we don't have them yet
      if (!hasUserRoles) {
        try {
          withRetry(async () => {
            const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles');
            
            if (roleError) {
              console.error("Error fetching user roles:", roleError);
            } else if (roleData?.roles) {
              console.log("Successfully fetched user roles");
              localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
              setHasUserRoles(true);
            }
          }, 2, 500, 2000);
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
    
    // Create default trial subscription
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
    
    // Store and dispatch
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription... {loadingTime > 2 ? `(${loadingTime}s)` : ''}</p>
      
      {/* Network status indicator */}
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
      
      {(networkError || loadingTime > 8) && (
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
            {loadingTime > 15 && (
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
