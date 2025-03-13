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
  // Add a new ref to track if the initial check has happened
  const initialCheckDoneRef = useRef<boolean>(false);
  // Add a ref to keep track of the timer IDs so we can properly clean them up
  const timersRef = useRef<{
    initialCheck: NodeJS.Timeout | null;
    refreshTimer: NodeJS.Timeout | null;
  }>({ initialCheck: null, refreshTimer: null });

  useEffect(() => {
    // Only proceed if we have a valid session and haven't done the initial check
    if (!session?.user) {
      return;
    }

    // Clear any existing timers to prevent duplicates
    if (timersRef.current.initialCheck) {
      clearTimeout(timersRef.current.initialCheck);
      timersRef.current.initialCheck = null;
    }
    
    if (timersRef.current.refreshTimer) {
      clearInterval(timersRef.current.refreshTimer);
      timersRef.current.refreshTimer = null;
    }

    // Initial check with a small delay to allow other effects to settle
    // But only if we haven't done the initial check yet
    if (!initialCheckDoneRef.current) {
      console.log("Setting up initial subscription check (once)");
      
      timersRef.current.initialCheck = setTimeout(() => {
        const now = Date.now();
        // Only check if we haven't checked recently (within last 60 seconds)
        if (now - lastRefreshTimeRef.current > 60000) {
          console.log("Performing initial subscription check");
          checkSubscription(false).catch(err => {
            console.error("Error during initial subscription check:", err);
          });
          lastRefreshTimeRef.current = now;
          initialCheckDoneRef.current = true;
        }
      }, 2000); // Increased from 1000ms to 2000ms to avoid race conditions
    }

    // Set up the regular refresh timer with a longer interval, but only if it's not already set
    if (!timersRef.current.refreshTimer) {
      console.log("Setting up subscription refresh timer (once)");
      
      timersRef.current.refreshTimer = setInterval(() => {
        const now = Date.now();
        // Increased minimum interval between checks to 5 minutes
        if (now - lastRefreshTimeRef.current > 5 * 60 * 1000) {
          console.log("Regular refresh timer: rechecking subscription");
          checkSubscription(false).catch(err => {
            console.error("Error during scheduled subscription check:", err);
          });
          lastRefreshTimeRef.current = now;
        } else {
          console.log("Skipping scheduled check - too soon since last check");
        }
      }, 15 * 60 * 1000); // Increased from 5 minutes to 15 minutes
    }
    
    // Return cleanup function
    return () => {
      if (timersRef.current.initialCheck) {
        clearTimeout(timersRef.current.initialCheck);
        timersRef.current.initialCheck = null;
      }
      
      if (timersRef.current.refreshTimer) {
        clearInterval(timersRef.current.refreshTimer);
        timersRef.current.refreshTimer = null;
      }
    };
  }, [session?.user?.id]); // Only depend on the user ID, not the entire session object
}
