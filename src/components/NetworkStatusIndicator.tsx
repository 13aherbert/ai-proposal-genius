
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Component that monitors network status and displays a visual indicator
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      setIsReconnecting(true);
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
      setIsReconnecting(false);
      
      if (response.ok) {
        toast.success("Network connection restored", {
          id: "network-status",
        });
      }
    } catch (error) {
      setIsOnline(false);
      setIsReconnecting(false);
      
      if (error.name !== 'AbortError') {
        console.error("Error checking network:", error);
      }
    }
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
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

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection status on mount
    if (navigator.onLine) {
      checkConnection();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, checkConnection]);

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
          onClick={checkConnection}
          className="ml-2 bg-white/20 p-1 rounded hover:bg-white/30 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
