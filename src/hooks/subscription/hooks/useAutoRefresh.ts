
import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

// Automatically refresh subscription data at regular intervals
export function useAutoRefresh(
  session: Session | null,
  checkSubscription: (forceRecheck?: boolean) => Promise<void>
) {
  useEffect(() => {
    if (!session?.user) return;

    // Skip the on-mount fetch — SubscriptionProvider already fetches on session/org changes.
    // Only refresh in the background to catch webhook-driven plan changes.
    const intervalId = setInterval(() => {
      checkSubscription().catch(err => {
        console.error("Error during auto-refresh of subscription:", err);
      });
    }, 600000); // 10 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [session?.user?.id]); // Only depend on user ID, not the entire session
}
