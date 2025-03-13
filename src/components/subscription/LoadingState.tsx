
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

export function LoadingState() {
  const [retryCount, setRetryCount] = useState(0);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Try to directly fetch subscription data if edge function fails
  useEffect(() => {
    const fetchSubscriptionDirect = async () => {
      try {
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session?.user?.id) {
          console.log("No authenticated user found for direct subscription fetch");
          return;
        }
        
        console.log("Attempting direct subscription fetch from database");
        
        // Query the database directly instead of using the edge function
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .single();
          
        if (error) {
          console.error("Error in direct subscription fetch:", error);
          setErrorOccurred(true);
          
          if (error.code === 'PGRST116') {
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
            localStorage.setItem('subscriptionData', JSON.stringify(typedData));
            toast.success("Subscription data loaded", { duration: 2000 });
          } catch (e) {
            console.error("Error storing subscription data locally:", e);
          }
        }
      } catch (err) {
        console.error("Exception in direct subscription fetch:", err);
        setErrorOccurred(true);
        toast.error("Could not load subscription data");
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
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [retryCount]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription...</p>
      
      {loadingTooLong && !errorOccurred && (
        <p className="text-muted-foreground mt-2 text-sm">
          This is taking longer than usual. Please wait...
        </p>
      )}
      
      {errorOccurred && (
        <div className="mt-4 text-center max-w-md">
          <p className="text-muted-foreground text-sm">
            Having trouble loading subscription data. Please refresh the page or try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90"
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
}
