
import { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Hook for managing user status data refreshing
 * Handles initialization, status fetching, and error states
 */
export function useUserStatusRefresh(
  session: Session | null,
  isLoadingStatus: boolean,
  fetchUserStatus: (force?: boolean) => Promise<void>,
  setLastError: (error: Error | null) => void
) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user data when session is available
  useEffect(() => {
    if (!isInitialized && session?.user && !isLoadingStatus) {
      console.log("Initializing AuthUserContext");
      fetchUserStatus(true)
        .catch(error => {
          console.error("Error during initial status fetch:", error);
          setLastError(error instanceof Error ? error : new Error(String(error)));
          
          setIsInitialized(true);
          
          if (navigator.onLine) {
            toast.error("Failed to load user data", {
              description: "Using cached data if available"
            });
          }
        });
      setIsInitialized(true);
    }
  }, [session, isInitialized, isLoadingStatus, fetchUserStatus, setLastError]);
  
  // Reset initialization flag when user changes
  useEffect(() => {
    if (session?.user?.id) {
      setIsInitialized(false);
    }
  }, [session?.user?.id]);
  
  // Handle the skipSubscriptionLoading event
  useEffect(() => {
    const handleSkipLoading = (e: Event) => {
      console.log("Handling skipSubscriptionLoading event in AuthUserContext");
      if (!isInitialized) {
        setIsInitialized(true);
      }
    };
    
    window.addEventListener('skipSubscriptionLoading', handleSkipLoading);
    
    return () => {
      window.removeEventListener('skipSubscriptionLoading', handleSkipLoading);
    };
  }, [isInitialized]);
  
  // Public method to refresh user status
  const refreshUserStatus = useCallback(async (force = false) => {
    if (session?.user) {
      try {
        await fetchUserStatus(force);
        setLastError(null);
      } catch (error) {
        console.error("Error refreshing user status:", error);
        setLastError(error instanceof Error ? error : new Error(String(error)));
        
        if (navigator.onLine) {
          toast.error("Failed to refresh user data", {
            description: "Using cached data if available"
          });
        }
      }
    }
  }, [session, fetchUserStatus, setLastError]);
  
  return { refreshUserStatus, isInitialized };
}
