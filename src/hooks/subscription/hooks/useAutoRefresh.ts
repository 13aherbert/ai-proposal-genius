
import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

// Automatically refresh subscription data at regular intervals
export function useAutoRefresh(
  session: Session | null,
  checkSubscription: (forceRecheck?: boolean) => Promise<void>
) {
  useEffect(() => {
    if (!session?.user) return;
    
    // Initial check on mount
    checkSubscription().catch(err => {
      console.error("Error during initial subscription check in auto-refresh:", err);
    });
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing subscription data");
      checkSubscription().catch(err => {
        console.error("Error during auto-refresh of subscription:", err);
      });
    }, 300000); // 5 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [session?.user?.id]); // Only depend on user ID, not the entire session
}
