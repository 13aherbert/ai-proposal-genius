
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network";

export function LoadingState() {
  const [retryCount, setRetryCount] = useState(0);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const isAttempting = useRef(false);

  // First try to load from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Verify this is valid subscription data
        if (parsedData.subscription_id) {
          console.log("Found cached subscription data:", parsedData);
          setLocalDataLoaded(true);
        }
      }
    } catch (e) {
      console.error("Error checking local storage:", e);
    }
  }, []);

  // Try to directly fetch subscription data if edge function fails
  useEffect(() => {
    if (isAttempting.current || retryCount > 2) return;
    
    const fetchSubscriptionDirect = async () => {
      if (isAttempting.current) return;
      
      try {
        isAttempting.current = true;
        
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          if (isNetworkError(sessionError)) {
            setNetworkError(true);
            toast.error(getNetworkErrorMessage(sessionError));
          }
          isAttempting.current = false;
          return;
        }
        
        if (!sessionData?.session?.user?.id) {
          console.log("No authenticated user found for direct subscription fetch");
          isAttempting.current = false;
          return;
        }
        
        console.log("Attempting direct subscription fetch from database");
        
        // Query the database directly instead of using the edge function
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error in direct subscription fetch:", error);
          setErrorOccurred(true);
          
          if (isNetworkError(error)) {
            setNetworkError(true);
            toast.error(getNetworkErrorMessage(error));
          } else if (error.code === 'PGRST116') {
            // No row found, this is a new user
            console.log("No subscription found, user may need a trial subscription created");
            toast.info("Setting up your account...");
          } else {
            toast.error("Error loading subscription data");
          }
        } else if (data) {
          console.log("Successfully fetched subscription data directly:", data);
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
            toast.success("Subscription data loaded", { duration: 2000 });
          } catch (e) {
            console.error("Error storing subscription data locally:", e);
          }
        }
      } catch (err) {
        console.error("Exception in direct subscription fetch:", err);
        setErrorOccurred(true);
        
        if (isNetworkError(err)) {
          setNetworkError(true);
          toast.error(getNetworkErrorMessage(err), {
            description: "Using cached data if available"
          });
        } else {
          toast.error("Could not load subscription data");
        }
      } finally {
        isAttempting.current = false;
      }
    };
    
    // Set a timeout to show "loading too long" message after 5 seconds
    const timeoutId = setTimeout(() => {
      setLoadingTooLong(true);
    }, 5000);
    
    // Only try direct fetch after 2 seconds and if this is the first retry
    if (retryCount === 0) {
      const timer = setTimeout(() => {
        fetchSubscriptionDirect();
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timeoutId);
        isAttempting.current = false;
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [retryCount]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription...</p>
      
      {loadingTooLong && !errorOccurred && !networkError && (
        <p className="text-muted-foreground mt-2 text-sm">
          This is taking longer than usual. Please wait...
        </p>
      )}
      
      {networkError && (
        <div className="mt-4 text-center max-w-md">
          <p className="text-muted-foreground text-sm">
            Network connectivity issues detected. We're using cached data if available.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {errorOccurred && !networkError && (
        <div className="mt-4 text-center max-w-md">
          <p className="text-muted-foreground text-sm">
            Having trouble loading subscription data. Please refresh the page or try again later.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90"
          >
            Refresh Page
          </button>
        </div>
      )}
      
      {localDataLoaded && (loadingTooLong || errorOccurred || networkError) && (
        <p className="text-muted-foreground mt-4 text-sm">
          Using cached subscription data
        </p>
      )}
    </div>
  );
}
