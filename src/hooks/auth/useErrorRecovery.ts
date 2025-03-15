
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthPersistence } from './useAuthPersistence';
import { Session } from '@supabase/supabase-js';

/**
 * Hook for handling authentication error recovery functionality
 * Manages error states and retry mechanisms
 */
export function useErrorRecovery(
  session: Session | null,
  isOffline: boolean,
  fetchUserStatus: (force?: boolean) => Promise<void>
) {
  const [lastError, setLastError] = useState<Error | null>(null);
  const [hasRecoveredFromError, setHasRecoveredFromError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { restoreSession } = useAuthPersistence();
  
  const retryAuthentication = useCallback(async () => {
    if (isOffline) {
      toast.error("Cannot retry while offline", {
        description: "Please check your internet connection"
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    try {
      if (!session) {
        const restoredSession = await restoreSession();
        if (restoredSession) {
          toast.success("Session restored successfully");
        }
      }
      
      await fetchUserStatus(true);
      
      setLastError(null);
      setHasRecoveredFromError(true);
      toast.success("Authentication recovered successfully");
    } catch (error) {
      console.error("Failed to retry authentication:", error);
      setLastError(error instanceof Error ? error : new Error(String(error)));
      
      toast.error("Recovery attempt failed", {
        description: retryCount >= 2 ? "Please try signing in again" : "Will try again automatically"
      });
      
      if (retryCount < 2) {
        setTimeout(() => {
          retryAuthentication();
        }, 3000);
      }
    }
  }, [isOffline, session, retryCount, restoreSession, fetchUserStatus]);

  // Retry automatically if we come back online with an error
  useEffect(() => {
    if (!isOffline && lastError && retryCount === 0) {
      retryAuthentication();
    }
  }, [isOffline, lastError, retryCount, retryAuthentication]);

  return {
    lastError,
    setLastError,
    hasRecoveredFromError,
    setHasRecoveredFromError,
    retryAuthentication,
  };
}
