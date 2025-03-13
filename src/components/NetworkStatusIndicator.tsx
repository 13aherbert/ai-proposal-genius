
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/network';

/**
 * Component that monitors network status and displays a visual indicator
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkingRef = useRef(false);
  const networkEventAttachedRef = useRef(false);

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
      setLastCheckTime(now);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try to fetch a small resource to see if we have real connectivity
      console.log("Checking network connection...");
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (!isOnline) {
          console.log("Network connection restored");
          setIsOnline(true);
          toast.success("Network connection restored", {
            id: "network-status",
          });
          
          // Dispatch a custom event that other components can listen for
          window.dispatchEvent(new CustomEvent('networkReconnected'));
        }
      } else {
        setIsOnline(false);
      }
    } catch (error: any) {
      console.error("Network check error:", error);
      setIsOnline(false);
    } finally {
      setIsReconnecting(false);
      checkingRef.current = false;
    }
  }, [isReconnecting, lastCheckTime, isOnline]);

  const handleOnline = useCallback(() => {
    console.log("Browser reports online status");
    // Don't immediately trust the browser's online event
    // Instead, verify with an actual network request
    checkConnection();
  }, [checkConnection]);

  const handleOffline = useCallback(() => {
    console.log("Browser reports offline status");
    setIsOnline(false);
    toast.error("Network connection lost", {
      id: "network-status",
      description: "Some features may not work properly until connection is restored"
    });
  }, []);

  useEffect(() => {
    if (!networkEventAttachedRef.current) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      networkEventAttachedRef.current = true;
      
      // Check connection status on mount, but only if we're supposedly online
      if (navigator.onLine) {
        setTimeout(() => {
          checkConnection();
        }, 1000); // Delay initial check to avoid resource contention at load time
      }
    }
    
    return () => {
      if (networkEventAttachedRef.current) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        networkEventAttachedRef.current = false;
      }
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
    
    checkConnection();
  };

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed bottom-4 right-4 bg-destructive/90 text-white p-2 rounded-md shadow-lg z-50 flex items-center space-x-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm">Offline</span>
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
