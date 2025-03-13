
import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

/**
 * Sets up automatic refresh for subscription data on a timer
 */
export function useAutoRefresh(
  session: Session | null,
  checkSubscription: (forceRecheck?: boolean) => Promise<void>
) {
  useEffect(() => {
    if (session?.user) {
      const refreshTimer = setInterval(() => {
        console.log("Regular refresh timer: rechecking subscription");
        checkSubscription(true);
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(refreshTimer);
    }
  }, [session, checkSubscription]);
}
