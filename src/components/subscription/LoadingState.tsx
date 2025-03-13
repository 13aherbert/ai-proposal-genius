
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function LoadingState() {
  const [retryCount, setRetryCount] = useState(0);
  const [errorOccurred, setErrorOccurred] = useState(false);

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
        } else if (data) {
          console.log("Successfully fetched subscription data directly:", data);
          // Store in localStorage as a fallback
          try {
            localStorage.setItem('subscriptionData', JSON.stringify(data));
          } catch (e) {
            console.error("Error storing subscription data locally:", e);
          }
        }
      } catch (err) {
        console.error("Exception in direct subscription fetch:", err);
        setErrorOccurred(true);
      }
    };
    
    // Only try direct fetch after 2 seconds and if this is the first retry
    if (retryCount === 0) {
      const timer = setTimeout(() => {
        fetchSubscriptionDirect();
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription...</p>
      {errorOccurred && (
        <p className="text-muted-foreground mt-2 text-sm">
          Having trouble loading subscription data. Please refresh the page.
        </p>
      )}
    </div>
  );
}
