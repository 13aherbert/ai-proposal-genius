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
  
  const persistSession = useCallback((accessToken: string, refreshToken: string, expiresAt?: number) => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      
      if (refreshToken) {
        localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
      }
      
      if (expiresAt) {
        localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
      }
      
      localStorage.setItem(AUTH_LAST_ACTIVE_KEY, Date.now().toString());
      localStorage.setItem(AUTH_SESSION_RECOVERY_ATTEMPTS, '0');
      
      console.log("Auth session persisted to localStorage");
    } catch (err) {
      console.error("Failed to persist authentication session:", err);
    }
  }, []);
  
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
  
  const shouldRefreshToken = useCallback(() => {
    try {
      const expiryTimestamp = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimestamp) return false;
      
      const expiryTime = parseInt(expiryTimestamp, 10);
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      
      return (expiryTime - now) < 600;
    } catch (err) {
      console.error("Error checking token expiry:", err);
      return false;
    }
  }, []);
  
  const refreshToken = useCallback(async () => {
    if (!shouldRefreshToken()) return null;
    
    try {
      const storedRefreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
      
      if (!storedRefreshToken) {
        console.warn("No refresh token available");
        return null;
      }
      
      console.log("Refreshing auth token");
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: storedRefreshToken,
      });
      
      if (error) {
        console.error("Error refreshing token:", error);
        return null;
      }
      
      if (data?.session) {
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
      
      if (!navigator.onLine && isNetworkError(err)) {
        return null;
      }
    }
    
    return null;
  }, [shouldRefreshToken]);
  
  const restoreSession = useCallback(async (): Promise<Session | null> => {
    if (!navigator.onLine) {
      console.log("Not attempting session restore while offline");
      return null;
    }
    
    if (recoveryInProgress.current) {
      console.log("Session recovery already in progress");
      return null;
    }
    
    recoveryInProgress.current = true;
    
    try {
      const storedAttempts = localStorage.getItem(AUTH_SESSION_RECOVERY_ATTEMPTS) || '0';
      const attempts = parseInt(storedAttempts, 10);
      
      if (attempts >= 3) {
        console.error("Too many session recovery attempts, giving up");
        toast.error("Could not restore your session", {
          description: "Please sign in again"
        });
        clearPersistedSession();
        recoveryInProgress.current = false;
        return null;
      }
      
      localStorage.setItem(AUTH_SESSION_RECOVERY_ATTEMPTS, (attempts + 1).toString());
      setRecoveryAttempts(attempts + 1);
      
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
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          clearPersistedSession();
        }
        recoveryInProgress.current = false;
        return null;
      }
      
      if (data?.session) {
        console.log("Session successfully restored from localStorage");
        
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
  
  const isSessionExpired = useCallback(() => {
    try {
      const expiryTimestamp = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimestamp) return true;
      
      const expiryTime = parseInt(expiryTimestamp, 10);
      return Date.now() > expiryTime * 1000;
    } catch (e) {
      console.error("Error checking session expiry:", e);
      return true;
    }
  }, []);
  
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
  
  const updateLastActive = useCallback(() => {
    try {
      localStorage.setItem(AUTH_LAST_ACTIVE_KEY, Date.now().toString());
    } catch (e) {
      console.error("Error updating last active time:", e);
    }
  }, []);
  
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
  
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (hasToken) {
        if (shouldRefreshToken() && navigator.onLine) {
          refreshToken();
        } else if (isSessionExpired() && navigator.onLine) {
          restoreSession();
        }
      }
      
      const updateActivity = () => {
        if (supabase.auth.getSession()) {
          updateLastActive();
        }
      };
      
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
