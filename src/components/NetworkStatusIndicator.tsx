
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/network';
import { useAuthUser } from '@/hooks/auth/AuthUserContext';
import { setupNetworkListeners } from '@/utils/network/offline-detection';

type OfflineMode = 'temporary' | 'persistent' | 'none';

/**
 * Component that monitors network status and displays a visual indicator
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [offlineMode, setOfflineMode] = useState<OfflineMode>('none');
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkingRef = useRef(false);
  const networkEventAttachedRef = useRef(false);
  const offlineDurationRef = useRef(0);
  const offlineStartRef = useRef(0);
  const auth = useAuthUser();

  const calculateOfflineDuration = useCallback(() => {
    if (offlineStartRef.current === 0) return 0;
    return Date.now() - offlineStartRef.current;
  }, []);

  const determineOfflineMode = useCallback(() => {
    const duration = calculateOfflineDuration();
    
    // If offline for more than 5 minutes, consider it persistent
    if (duration > 5 * 60 * 1000) {
      setOfflineMode('persistent');
    } else {
      setOfflineMode('temporary');
    }
  }, [calculateOfflineDuration]);

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
          const duration = calculateOfflineDuration();
          console.log(`Network connection restored after ${Math.round(duration / 1000)}s offline`);
          setIsOnline(true);
          setShowOfflineBanner(false);
          setOfflineMode('none');
          offlineStartRef.current = 0;
          
          // Only show reconnection toast if we were offline for a notable time
          if (duration > 2000) {
            toast.success("Network connection restored", {
              id: "network-status",
            });
          }
          
          // If we've been offline for a while, refresh auth state
          if (duration > 30000 && auth.isAuthenticated) {
            auth.refreshUserStatus(true).catch(console.error);
          }
          
          // Dispatch a custom event that other components can listen for
          window.dispatchEvent(new CustomEvent('networkReconnected', {
            detail: { offlineDuration: duration }
          }));
        }
      } else {
        handleOfflineState();
      }
    } catch (error: any) {
      console.error("Network check error:", error);
      handleOfflineState();
    } finally {
      setIsReconnecting(false);
      checkingRef.current = false;
    }
  }, [isReconnecting, lastCheckTime, isOnline, calculateOfflineDuration, auth]);

  const handleOfflineState = useCallback(() => {
    setIsOnline(false);
    setShowOfflineBanner(true);
    
    // Record when we first went offline
    if (offlineStartRef.current === 0) {
      offlineStartRef.current = Date.now();
    }
    
    determineOfflineMode();
    
    // Record offline duration for analytics
    offlineDurationRef.current = calculateOfflineDuration();
  }, [determineOfflineMode, calculateOfflineDuration]);

  const handleOnline = useCallback(() => {
    console.log("Browser reports online status");
    // Don't immediately trust the browser's online event
    // Instead, verify with an actual network request
    checkConnection();
  }, [checkConnection]);

  const handleOffline = useCallback(() => {
    console.log("Browser reports offline status");
    handleOfflineState();
    
    toast.error("Network connection lost", {
      id: "network-status",
      description: "Some features may not work properly until connection is restored"
    });
  }, [handleOfflineState]);

  useEffect(() => {
    if (!networkEventAttachedRef.current) {
      const cleanup = setupNetworkListeners((online) => {
        if (online) {
          handleOnline();
        } else {
          handleOffline();
        }
      });
      
      networkEventAttachedRef.current = true;
      
      // Check connection status on mount, but only if we're supposedly online
      if (navigator.onLine) {
        setTimeout(() => {
          checkConnection();
        }, 1000); // Delay initial check to avoid resource contention at load time
      } else {
        handleOfflineState();
      }
      
      return cleanup;
    }
  }, [handleOnline, handleOffline, checkConnection, handleOfflineState]);

  // Check periodically when offline to detect reconnection
  useEffect(() => {
    if (!isOnline) {
      const intervalId = setInterval(() => {
        determineOfflineMode();
        checkConnection();
      }, 30000); // Check every 30 seconds when offline
      
      return () => clearInterval(intervalId);
    }
  }, [isOnline, checkConnection, determineOfflineMode]);

  const handleRetry = () => {
    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    checkConnection();
  };

  if (isOnline && !showOfflineBanner) {
    return null; // Don't show anything when online
  }

  // Show the offline indicator
  return (
    <>
      {/* Persistent banner at the top */}
      <div className="fixed top-0 left-0 right-0 bg-destructive text-white p-2 z-50 flex items-center justify-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">
          {offlineMode === 'persistent' 
            ? "You're offline. Using cached data where available." 
            : "You're offline. Some features may not work properly."}
        </span>
        {isReconnecting ? (
          <RefreshCw className="h-4 w-4 animate-spin ml-2" />
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
      
      {/* Add padding to the top of the page to account for the banner */}
      <div className="h-10"></div>
      
      {/* Show additional offline UI for persistent offline mode */}
      {offlineMode === 'persistent' && (
        <div className="fixed bottom-4 right-4 bg-background shadow-lg rounded-lg p-4 border border-muted z-40 max-w-[300px]">
          <div className="flex items-center mb-2">
            <CloudOff className="h-5 w-5 text-destructive mr-2" />
            <h3 className="font-semibold text-sm">Offline Mode Active</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            You've been offline for {Math.round(offlineDurationRef.current / 60000)} minutes.
            Using cached data where available. Some features will be limited.
          </p>
          <button
            onClick={handleRetry}
            className="w-full bg-primary text-primary-foreground text-xs py-1.5 px-2 rounded flex items-center justify-center"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check Connection
          </button>
        </div>
      )}
    </>
  );
}
