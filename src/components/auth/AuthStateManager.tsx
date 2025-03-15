
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/utils/network";
import { withRetry } from "@/utils/network/retry";

export type AuthState = 
  | { status: 'initializing' }
  | { status: 'authenticated'; session: Session }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: Error }
  | { status: 'offline' }; // Add a new status for offline scenarios

export type AuthActions = {
  initialize: () => Promise<void>;
  restoreSession: () => Promise<Session | null>;
};

/**
 * Hook that manages the authentication state with improved resilience
 */
export function useAuthStateManager(): [AuthState, AuthActions] {
  const [authState, setAuthState] = useState<AuthState>({ status: 'initializing' });
  const initializeAttempted = useRef(false);
  const maxRetryAttempts = 3;
  const isNetworkError = useRef(false);

  // Initialize auth state by checking for an existing session
  const initialize = async (): Promise<void> => {
    if (initializeAttempted.current) return;
    initializeAttempted.current = true;
    
    console.log("Initializing auth state");
    
    // Check network connection first
    const isOnline = navigator.onLine;
    if (!isOnline) {
      console.log("Device is offline, setting offline auth state");
      isNetworkError.current = true;
      setAuthState({ status: 'offline' });
      
      // Add listener to retry when we come back online
      const handleOnline = async () => {
        console.log("Device is back online, attempting to restore auth state");
        isNetworkError.current = false;
        // Reset initialization flag to allow retry
        initializeAttempted.current = false;
        // Remove this listener
        window.removeEventListener('online', handleOnline);
        // Try again
        await initialize();
      };
      
      window.addEventListener('online', handleOnline);
      return;
    }
    
    try {
      // Check local token first for faster startup
      const storedToken = getAuthToken();
      
      if (storedToken) {
        console.log("Found stored auth token, attempting to restore session");
        const session = await restoreSession();
        
        if (session) {
          console.log("Session successfully restored from token");
          setAuthState({ status: 'authenticated', session });
          return;
        }
      }
      
      // If no token or token restoration failed, try to get the session normally
      const { data, error } = await withRetry(
        () => supabase.auth.getSession(),
        maxRetryAttempts,
        1000,
        5000
      );
      
      if (error) {
        console.error("Error getting session:", error);
        
        // Check if this is a network error
        if (error.message?.includes('network') || !navigator.onLine) {
          isNetworkError.current = true;
          setAuthState({ status: 'offline' });
          return;
        }
        
        setAuthState({ status: 'error', error });
        
        // Show error toast only for non-"not authenticated" errors
        if (error.message !== "Not authenticated") {
          toast.error("Authentication error", {
            description: "There was a problem connecting to the authentication service"
          });
        }
        
        return;
      }
      
      if (data.session) {
        console.log("Session found during initialization");
        setAuthState({ status: 'authenticated', session: data.session });
        
        // Store token for future restorations
        if (data.session.access_token) {
          setAuthToken(data.session.access_token);
        }
      } else {
        console.log("No active session found");
        setAuthState({ status: 'unauthenticated' });
      }
    } catch (err) {
      console.error("Unexpected error during auth initialization:", err);
      
      // Check if this appears to be a network error
      if (!navigator.onLine || (err instanceof Error && err.message?.includes('network'))) {
        isNetworkError.current = true;
        setAuthState({ status: 'offline' });
        return;
      }
      
      setAuthState({ status: 'error', error: err instanceof Error ? err : new Error('Unknown error during authentication') });
      
      toast.error("Authentication error", {
        description: "Failed to initialize authentication"
      });
    }
  };

  // Attempt to restore a session from a stored token
  const restoreSession = async (): Promise<Session | null> => {
    const storedToken = getAuthToken();
    
    if (!storedToken) {
      console.log("No stored token found for session restoration");
      return null;
    }
    
    try {
      console.log("Attempting to restore session from token");
      
      const { data, error } = await withRetry(
        () => supabase.auth.setSession({
          access_token: storedToken,
          refresh_token: ''
        }),
        maxRetryAttempts,
        1000,
        5000
      );
      
      if (error) {
        console.error("Error restoring session from token:", error);
        
        // Check if this is due to being offline
        if (error.message?.includes('network') || !navigator.onLine) {
          console.log("Network error during session restoration");
          isNetworkError.current = true;
          
          // In offline mode, we'll just assume the token might still be valid
          // This allows the app to attempt to work offline with cached data
          return null;
        }
        
        removeAuthToken(); // Clear invalid token
        return null;
      }
      
      if (data?.session) {
        console.log("Session successfully restored");
        return data.session;
      }
      
      console.log("No session returned from restoration attempt");
      return null;
    } catch (error) {
      console.error("Exception restoring session:", error);
      
      // Network error during restoration attempt
      if (!navigator.onLine) {
        console.log("Device is offline during session restoration");
        isNetworkError.current = true;
        // We don't clear the token here since it might be valid when online again
        return null;
      }
      
      removeAuthToken(); // Clear potentially corrupted token
      return null;
    }
  };

  // Listen for network status changes
  useEffect(() => {
    // Only if we had a network error, try again when coming online
    if (isNetworkError.current) {
      const handleOnline = () => {
        console.log("Network is back, retrying authentication");
        // Reset initialization flag to allow retry
        initializeAttempted.current = false;
        isNetworkError.current = false;
        initialize().catch(err => {
          console.error("Error during re-initialization after network recovery:", err);
        });
      };
      
      window.addEventListener('online', handleOnline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [authState.status]);

  return [
    authState,
    {
      initialize,
      restoreSession
    }
  ];
}
