
import { useState, useEffect, useCallback } from 'react';
import { setupNetworkListeners } from '@/utils/network/offline-detection';

/**
 * Hook for managing network connectivity status
 * Detects online/offline state and provides status information
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Update handler with timestamp tracking
  const handleNetworkChange = useCallback((online: boolean) => {
    setIsOffline(!online);
    setLastChecked(new Date());
    console.log(`Network status changed: ${online ? 'online' : 'offline'}`);
  }, []);

  // Active network check function
  const checkNetworkConnection = useCallback(async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    try {
      console.log("Performing active network connection check");
      // Use a very lightweight endpoint for checking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://bmopbbkfxkgzlbmhhgox.supabase.co/auth/v1/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      const online = response.ok || response.status === 401; // 401 means the service is available
      handleNetworkChange(online);
      
      // If browser reports online but we detected offline, or vice versa, log the discrepancy
      if (navigator.onLine !== online) {
        console.log(`Actual connection status (${online}) differs from browser reported (${navigator.onLine})`);
      }
    } catch (err) {
      console.warn("Network check failed:", err);
      handleNetworkChange(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [isCheckingConnection, handleNetworkChange]);
  
  useEffect(() => {
    // Initialize with the current navigator.onLine value
    setIsOffline(!navigator.onLine);
    
    // Set up network listeners with our callback
    const cleanup = setupNetworkListeners(handleNetworkChange);
    
    // Initial check on component mount
    checkNetworkConnection();
    
    // Set up periodic checks
    const intervalId = setInterval(() => {
      checkNetworkConnection();
    }, 30000); // Check every 30 seconds
    
    return () => {
      cleanup();
      clearInterval(intervalId);
    };
  }, [handleNetworkChange, checkNetworkConnection]);
  
  return { 
    isOffline,
    lastChecked,
    isOnline: !isOffline,
    checkConnection: checkNetworkConnection
  };
}
