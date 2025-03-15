
import { useState, useEffect, useCallback, useRef } from 'react';
import { setupNetworkListeners } from '@/utils/network/offline-detection';

/**
 * Hook for managing network connectivity status
 * Detects online/offline state and provides status information
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const lastCheckRef = useRef<number>(Date.now());
  const checkInProgressRef = useRef<boolean>(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update handler with timestamp tracking
  const handleNetworkChange = useCallback((online: boolean) => {
    setIsOffline(!online);
    setLastChecked(new Date());
    console.log(`Network status changed: ${online ? 'online' : 'offline'}`);
  }, []);

  // Active network check function with increased throttling
  const checkNetworkConnection = useCallback(async () => {
    // Prevent concurrent checks and throttle requests
    if (checkInProgressRef.current) return;
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    // Increase throttle to at least 30 seconds unless forced
    if (timeSinceLastCheck < 30000) {
      return;
    }
    
    checkInProgressRef.current = true;
    setIsCheckingConnection(true);
    lastCheckRef.current = now;
    
    try {
      console.log("Performing active network connection check");
      // Use a very lightweight endpoint for checking, with shorter timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Shorter timeout
      
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
      
      // Consider 401 as successful connection - it means service is available
      const online = response.ok || response.status === 401;
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
      checkInProgressRef.current = false;
    }
  }, [handleNetworkChange]);
  
  useEffect(() => {
    // Initialize with the current navigator.onLine value
    setIsOffline(!navigator.onLine);
    
    // Set up network listeners with our callback
    const cleanup = setupNetworkListeners(handleNetworkChange);
    
    // Initial check on component mount (with a longer delay to avoid startup contention)
    setTimeout(() => {
      checkNetworkConnection();
    }, 3000); // Increased delay to reduce initial load contention
    
    // Set up periodic checks with significantly reduced frequency
    const intervalId = setInterval(() => {
      // Only check if not currently checking
      if (!checkInProgressRef.current) {
        checkNetworkConnection();
      }
    }, 120000); // Check every 2 minutes instead of 1 minute
    
    return () => {
      cleanup();
      clearInterval(intervalId);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [handleNetworkChange, checkNetworkConnection]);
  
  return { 
    isOffline,
    lastChecked,
    isOnline: !isOffline,
    checkConnection: checkNetworkConnection
  };
}
