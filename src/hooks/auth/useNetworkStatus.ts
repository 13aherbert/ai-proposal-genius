
import { useState, useEffect, useCallback } from 'react';
import { setupNetworkListeners } from '@/utils/network/offline-detection';

/**
 * Hook for managing network connectivity status
 * Detects online/offline state and provides status information
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  
  // Update handler with timestamp tracking
  const handleNetworkChange = useCallback((online: boolean) => {
    setIsOffline(!online);
    setLastChecked(new Date());
  }, []);
  
  useEffect(() => {
    // Initialize with the current navigator.onLine value
    setIsOffline(!navigator.onLine);
    
    // Set up network listeners with our callback
    const cleanup = setupNetworkListeners(handleNetworkChange);
    
    // Force a check on component mount
    const initialCheckTimeout = setTimeout(() => {
      fetch('https://bmopbbkfxkgzlbmhhgox.supabase.co/auth/v1/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }).then(() => {
        handleNetworkChange(true);
      }).catch(err => {
        console.warn('Initial connectivity check failed:', err);
        handleNetworkChange(false);
      });
    }, 1000);
    
    return () => {
      cleanup();
      clearTimeout(initialCheckTimeout);
    };
  }, [handleNetworkChange]);
  
  return { 
    isOffline,
    lastChecked,
    isOnline: !isOffline
  };
}
