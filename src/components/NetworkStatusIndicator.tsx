
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/network-utils';

/**
 * Component that monitors network status and displays a visual indicator
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [resourceError, setResourceError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    // Prevent multiple simultaneous connection checks
    if (isReconnecting || checkingRef.current) return;
    
    // Rate limit checks to prevent too many requests
    const now = Date.now();
    if (now - lastCheckTime < 5000) {
      return;
    }
    
    try {
      setIsReconnecting(true);
      checkingRef.current = true;
      setResourceError(false);
      setLastCheckTime(now);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try to fetch a small resource to see if we have real connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      setIsOnline(response.ok);
      
      if (response.ok) {
        toast.success("Network connection restored", {
          id: "network-status",
        });
      }
    } catch (error: any) {
      setIsOnline(false);
      
      if (error.name !== 'AbortError') {
        console.error("Error checking network:", error);
        
        if (error.message && error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          setResourceError(true);
          toast.error("Browser resource limit reached", {
            id: "resource-error",
            description: "Try refreshing the page or closing unused tabs"
          });
        }
      }
    } finally {
      setIsReconnecting(false);
      checkingRef.current = false;
    }
  }, [isReconnecting, lastCheckTime]);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setResourceError(false);
    toast.success("Network connection restored", {
      id: "network-status",
    });
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast.error("Network connection lost", {
      id: "network-status",
      description: "Some features may not work properly until connection is restored"
    });
  }, []);

  // Monitor for ERR_INSUFFICIENT_RESOURCES errors
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      try {
        return await originalFetch.apply(this, args);
      } catch (error: any) {
        if (error.message && error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          setResourceError(true);
          toast.error("Browser resource limit reached", {
            id: "resource-error",
            description: "Try refreshing the page or closing unused tabs"
          });
        }
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection status on mount, but only if we're supposedly online
    if (navigator.onLine) {
      setTimeout(() => {
        checkConnection();
      }, 1000); // Delay initial check to avoid resource contention at load time
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline, checkConnection]);

  const handleRetry = () => {
    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // If there was a resource error, wait a bit longer before retrying
    if (resourceError) {
      toast.info("Waiting for browser resources to free up...", {
        duration: 5000
      });
      checkTimeoutRef.current = setTimeout(() => {
        checkConnection();
      }, 5000);
    } else {
      checkConnection();
    }
  };

  if (isOnline && !resourceError) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed bottom-4 right-4 bg-destructive/90 text-white p-2 rounded-md shadow-lg z-50 flex items-center space-x-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm">
        {resourceError ? "Resource Limit" : "Offline"}
      </span>
      {isReconnecting ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <button 
          onClick={handleRetry}
          className="ml-2 bg-white/20 p-1 rounded hover:bg-white/30 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
