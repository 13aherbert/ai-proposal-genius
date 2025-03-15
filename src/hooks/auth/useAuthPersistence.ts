
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isNetworkError } from '@/utils/network';
import { Session } from '@supabase/supabase-js';

const AUTH_TOKEN_KEY = 'userToken';
const AUTH_REFRESH_KEY = 'userRefreshToken';
const SESSION_EXPIRY_KEY = 'sessionExpiry';
const AUTH_LAST_ACTIVE_KEY = 'authLastActive';
const AUTH_SESSION_RECOVERY_ATTEMPTS = 'authRecoveryAttempts';

export function useAuthPersistence() {
  const initialized = useRef(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const recoveryInProgress = useRef(false);
  
  // Store authentication tokens in localStorage for offline access
  const persistSession = useCallback((accessToken: string, refreshToken: string, expiresAt?: number) => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      
      if (refreshToken) {
        localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
      }
      
      if (expiresAt) {
        localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
      }
      
      // Store last active timestamp
      localStorage.setItem(AUTH_LAST_ACTIVE_KEY, Date.now().toString());
      
      // Reset recovery attempts on successful persistence
      localStorage.setItem(AUTH_SESSION_RECOVERY_ATTEMPTS, '0');
      
      console.log("Auth session persisted to localStorage");
    } catch (err) {
      console.error("Failed to persist authentication session:", err);
    }
  }, []);
  
  // Remove authentication data from localStorage
  const clearPersistedSession = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      localStorage.removeItem(AUTH_LAST_ACTIVE_KEY);
      localStorage.removeItem(AUTH_SESSION_RECOVERY_ATTEMPTS);
      localStorage.removeItem('userRoles');
      localStorage.removeItem('subscriptionData');
      localStorage.removeItem('userStatus');
      console.log("Auth session cleared from localStorage");
    } catch (err) {
      console.error("Failed to clear persisted session:", err);
    }
  }, []);
  
  // Check if the token is about to expire and needs refreshing
  const shouldRefreshToken = useCallback(() => {
    try {
      const expiryTimestamp = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimestamp) return false;
      
      const expiryTime = parseInt(expiryTimestamp, 10);
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      
      // Refresh if less than 10 minutes until expiry
      return (expiryTime - now) < 600;
    } catch (err) {
      console.error("Error checking token expiry:", err);
      return false;
    }
  }, []);
  
  // Refresh the token if it's about to expire
  const refreshToken = useCallback(async () => {
    if (!shouldRefreshToken()) return null;
    
    try {
      const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
      
      if (!refreshToken) {
        console.warn("No refresh token available");
        return null;
      }
      
      console.log("Refreshing auth token");
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error("Error refreshing token:", error);
        return null;
      }
      
      if (data?.session) {
        // Store the new session
        persistSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_at
        );
        
        console.log("Token refreshed successfully");
        return data.session;
      }
    } catch (err) {
      console.error("Exception refreshing token:", err);
      
      // Don't show network errors if offline
      if (!navigator.onLine && isNetworkError(err)) {
        return null;
      }
    }
    
    return null;
  }, [shouldRefreshToken, persistSession]);
  
  // Restore session from localStorage if supabase auth isn't initialized
  const restoreSession = useCallback(async (): Promise<Session | null> => {
    // Don't attempt if we're offline
    if (!navigator.onLine) {
      console.log("Not attempting session restore while offline");
      return null;
    }
    
    // Prevent concurrent recovery attempts
    if (recoveryInProgress.current) {
      console.log("Session recovery already in progress");
      return null;
    }
    
    recoveryInProgress.current = true;
    
    try {
      // Track recovery attempts
      const storedAttempts = localStorage.getItem(AUTH_SESSION_RECOVERY_ATTEMPTS) || '0';
      const attempts = parseInt(storedAttempts, 10);
      
      // Limit recovery attempts to prevent infinite loops
      if (attempts >= 3) {
        console.error("Too many session recovery attempts, giving up");
        toast.error("Could not restore your session", {
          description: "Please sign in again"
        });
        clearPersistedSession();
        recoveryInProgress.current = false;
        return null;
      }
      
      // Update recovery attempts
      localStorage.setItem(AUTH_SESSION_RECOVERY_ATTEMPTS, (attempts + 1).toString());
      setRecoveryAttempts(attempts + 1);
      
      // Try to refresh token first if possible
      const refreshedSession = await refreshToken();
      if (refreshedSession) {
        console.log("Session restored via token refresh");
        recoveryInProgress.current = false;
        return refreshedSession;
      }
      
      const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
      
      if (!accessToken) {
        recoveryInProgress.current = false;
        return null;
      }
      
      console.log("Attempting to restore session from localStorage");
      
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      
      if (error) {
        console.error("Error restoring session:", error);
        // If token is invalid, clear it
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          clearPersistedSession();
        }
        recoveryInProgress.current = false;
        return null;
      }
      
      if (data?.session) {
        console.log("Session successfully restored from localStorage");
        
        // Update stored session with latest data
        persistSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_at
        );
        
        recoveryInProgress.current = false;
        return data.session;
      }
    } catch (err) {
      console.error("Exception restoring session:", err);
      
      // Don't show network errors if offline
      if (navigator.onLine && !isNetworkError(err)) {
        toast.error("Error restoring your session", {
          description: "Please try again or sign in"
        });
      }
    } finally {
      recoveryInProgress.current = false;
    }
    
    return null;
  }, [clearPersistedSession, persistSession, refreshToken]);
  
  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    try {
      const expiryTimestamp = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimestamp) return true;
      
      const expiryTime = parseInt(expiryTimestamp, 10);
      return Date.now() > expiryTime * 1000; // Convert to milliseconds
    } catch (e) {
      console.error("Error checking session expiry:", e);
      return true;
    }
  }, []);
  
  // Check how long the session has been inactive
  const getSessionInactiveTime = useCallback(() => {
    try {
      const lastActive = localStorage.getItem(AUTH_LAST_ACTIVE_KEY);
      
      if (!lastActive) return Infinity;
      
      const lastActiveTime = parseInt(lastActive, 10);
      return Date.now() - lastActiveTime;
    } catch (e) {
      console.error("Error checking session inactivity:", e);
      return Infinity;
    }
  }, []);
  
  // Update the last active timestamp
  const updateLastActive = useCallback(() => {
    try {
      localStorage.setItem(AUTH_LAST_ACTIVE_KEY, Date.now().toString());
    } catch (e) {
      console.error("Error updating last active time:", e);
    }
  }, []);
  
  // Set up automatic session persistence when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        persistSession(
          session.access_token,
          session.refresh_token,
          session.expires_at
        );
      } else if (event === 'SIGNED_OUT') {
        clearPersistedSession();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [persistSession, clearPersistedSession]);
  
  // Initialize auth persistence on component mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      // Only attempt to restore if we have a token stored
      const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (hasToken) {
        // Check if token needs refresh
        if (shouldRefreshToken() && navigator.onLine) {
          refreshToken();
        } else if (isSessionExpired() && navigator.onLine) {
          // Try to restore if expired
          restoreSession();
        }
      }
      
      // Set up activity tracking
      const updateActivity = () => {
        if (supabase.auth.getSession()) {
          updateLastActive();
        }
      };
      
      // Track user activity
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      
      return () => {
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
      };
    }
  }, [shouldRefreshToken, refreshToken, isSessionExpired, restoreSession, updateLastActive]);
  
  return {
    persistSession,
    clearPersistedSession,
    restoreSession,
    refreshToken,
    isSessionExpired,
    getSessionInactiveTime,
    updateLastActive,
    recoveryAttempts,
  };
}
