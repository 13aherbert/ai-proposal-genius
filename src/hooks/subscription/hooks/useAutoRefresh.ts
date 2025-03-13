
import { useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';

/**
 * Sets up automatic refresh for subscription data on a timer
 * with debouncing to prevent excessive calls
 */
export function useAutoRefresh(
  session: Session | null,
  checkSubscription: (forceRecheck?: boolean) => Promise<void>
) {
  // Use a ref to track the last refresh time to avoid excessive refreshes
  const lastRefreshTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!session?.user) return;

    // Only set up the refresh timer if we have a valid session
    console.log("Setting up subscription refresh timer");
    
    // Initial check with a small delay to allow other effects to settle
    const initialCheckTimeout = setTimeout(() => {
      const now = Date.now();
      // Only check if we haven't checked recently (within last 30 seconds)
      if (now - lastRefreshTimeRef.current > 30000) {
        console.log("Initial subscription check");
        checkSubscription(false);
        lastRefreshTimeRef.current = now;
      }
    }, 1000);

    // Set up the regular refresh timer with a longer interval
    const refreshTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastRefreshTimeRef.current > 60000) { // Only check if it's been at least 1 minute
        console.log("Regular refresh timer: rechecking subscription");
        checkSubscription(false); // Using false to avoid force-rechecking too frequently
        lastRefreshTimeRef.current = now;
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(refreshTimer);
    };
  }, [session, checkSubscription]);
}
