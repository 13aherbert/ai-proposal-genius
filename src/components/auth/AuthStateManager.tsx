
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthError } from "@supabase/supabase-js";
import { getAuthToken, setAuthToken, clearAuthData } from "@/utils/network";

// Auth state types
type AuthState = 
  | { status: 'initializing' }
  | { status: 'authenticated'; session: Session }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: AuthError | Error };

// Auth actions
type AuthActions = {
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: Record<string, any>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetSession: (session: Session | null) => void;
};

/**
 * Hook for managing authentication state
 * Provides a clean separation of auth state and actions
 */
export function useAuthStateManager(): [AuthState, AuthActions] {
  const [authState, setAuthState] = useState<AuthState>({ status: 'initializing' });
  
  // Initialize auth state from storage or session
  const initialize = async () => {
    try {
      setAuthState({ status: 'initializing' });
      
      // First try to restore session from localStorage token if available
      const storedToken = getAuthToken();
      
      if (storedToken) {
        try {
          console.log("Attempting to restore session from stored token");
          const { data, error } = await supabase.auth.setSession({
            access_token: storedToken,
            refresh_token: ''
          });
          
          if (error) {
            console.warn("Failed to restore session from token:", error.message);
            clearAuthData();
            setAuthState({ status: 'unauthenticated' });
            return;
          }
          
          if (data?.session) {
            console.log("Successfully restored session from token");
            setAuthState({ 
              status: 'authenticated', 
              session: data.session 
            });
            return;
          }
        } catch (tokenError) {
          console.error("Error restoring session from token:", tokenError);
        }
      }
      
      // If token restoration failed, try getting the current session
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setAuthState({ status: 'error', error });
          return;
        }
        
        if (data.session) {
          console.log("Session found during initialization");
          setAuthToken(data.session.access_token);
          setAuthState({ status: 'authenticated', session: data.session });
        } else {
          console.log("No session found during initialization");
          setAuthState({ status: 'unauthenticated' });
        }
      } catch (e) {
        console.error("Unexpected error during auth initialization:", e);
        setAuthState({ 
          status: 'error', 
          error: e instanceof AuthError ? e : new Error('Authentication initialization failed') 
        });
      }
    } catch (finalError) {
      console.error("Critical error during auth initialization:", finalError);
      setAuthState({ 
        status: 'error', 
        error: finalError instanceof AuthError ? finalError : new Error('Authentication initialization failed') 
      });
    }
  };
  
  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              setAuthToken(session.access_token);
              setAuthState({ status: 'authenticated', session });
            }
            break;
          case 'SIGNED_OUT':
            clearAuthData();
            setAuthState({ status: 'unauthenticated' });
            break;
          case 'TOKEN_REFRESHED':
            if (session) {
              setAuthToken(session.access_token);
              setAuthState({ status: 'authenticated', session });
            }
            break;
          case 'USER_UPDATED':
            if (session) {
              setAuthState({ status: 'authenticated', session });
            }
            break;
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }
      
      if (data.session) {
        setAuthToken(data.session.access_token);
      }
      
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { 
        error: error instanceof AuthError 
          ? error 
          : new AuthError('Sign in failed due to an unexpected error')
      };
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: Record<string, any>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        console.error("Sign up error:", error);
        return { error };
      }
      
      if (data.session) {
        setAuthToken(data.session.access_token);
      }
      
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      return { 
        error: error instanceof AuthError 
          ? error 
          : new AuthError('Sign up failed due to an unexpected error')
      };
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      clearAuthData();
      await supabase.auth.signOut();
      setAuthState({ status: 'unauthenticated' });
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthState({ 
        status: 'error', 
        error: error instanceof AuthError ? error : new Error('Sign out failed') 
      });
      throw error;
    }
  };
  
  // Reset session (useful for manual session updates)
  const resetSession = (session: Session | null) => {
    if (session) {
      setAuthToken(session.access_token);
      setAuthState({ status: 'authenticated', session });
    } else {
      setAuthState({ status: 'unauthenticated' });
    }
  };
  
  // Bundle actions
  const actions: AuthActions = {
    initialize,
    signIn,
    signUp,
    signOut,
    resetSession
  };
  
  return [authState, actions];
}
