
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AUTH_TOKEN_KEY = 'userToken';
const AUTH_REFRESH_KEY = 'userRefreshToken';
const SESSION_EXPIRY_KEY = 'sessionExpiry';

export function useAuthPersistence() {
  const initialized = useRef(false);
  
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
      localStorage.removeItem('userRoles');
      localStorage.removeItem('subscriptionData');
      localStorage.removeItem('userStatus');
      console.log("Auth session cleared from localStorage");
    } catch (err) {
      console.error("Failed to clear persisted session:", err);
    }
  }, []);
  
  // Restore session from localStorage if supabase auth isn't initialized
  const restoreSession = useCallback(async () => {
    if (initialized.current) return;
    
    const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
    
    if (!accessToken) return null;
    
    try {
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
        return null;
      }
      
      if (data?.session) {
        console.log("Session successfully restored from localStorage");
        return data.session;
      }
    } catch (err) {
      console.error("Exception restoring session:", err);
    }
    
    return null;
  }, [clearPersistedSession]);
  
  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    const expiryTimestamp = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!expiryTimestamp) return true;
    
    const expiryTime = parseInt(expiryTimestamp, 10);
    return Date.now() > expiryTime * 1000; // Convert to milliseconds
  }, []);
  
  // Initialize auth persistence on component mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      restoreSession();
    }
  }, [restoreSession]);
  
  return {
    persistSession,
    clearPersistedSession,
    restoreSession,
    isSessionExpired,
  };
}
