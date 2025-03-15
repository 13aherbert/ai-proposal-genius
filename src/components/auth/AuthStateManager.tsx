
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
  | { status: 'error'; error: Error };

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

  // Initialize auth state by checking for an existing session
  const initialize = async (): Promise<void> => {
    if (initializeAttempted.current) return;
    initializeAttempted.current = true;
    
    console.log("Initializing auth state");
    
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
    } catch (error) {
      console.error("Unexpected error during auth initialization:", error);
      setAuthState({ status: 'error', error: error instanceof Error ? error : new Error('Unknown error during authentication') });
      
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
      removeAuthToken(); // Clear potentially corrupted token
      return null;
    }
  };

  return [
    authState,
    {
      initialize,
      restoreSession
    }
  ];
}
