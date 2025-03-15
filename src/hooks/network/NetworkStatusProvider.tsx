
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export type NetworkStatus = {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
  reconnecting: boolean;
};

type NetworkContextType = {
  status: NetworkStatus;
  checkConnection: () => Promise<boolean>;
};

const initialNetworkStatus: NetworkStatus = {
  isOnline: navigator.onLine,
  wasOffline: false,
  lastOnlineAt: navigator.onLine ? new Date() : null,
  lastOfflineAt: !navigator.onLine ? new Date() : null,
  reconnecting: false,
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetworkStatus = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};

export const NetworkStatusProvider = ({ children }: { children: ReactNode }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(initialNetworkStatus);

  // Active check for connection using fetch
  const checkConnection = async (): Promise<boolean> => {
    // If the browser already knows we're offline, don't try to fetch
    if (!navigator.onLine) return false;

    try {
      // Use Date.now() to prevent caching
      const response = await fetch(`/favicon.ico?_=${Date.now()}`, { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const isOnline = response.ok;
      
      // Update status if it has changed
      if (isOnline !== networkStatus.isOnline) {
        updateNetworkStatus(isOnline);
      }
      
      return isOnline;
    } catch (error) {
      // If fetch fails, we're offline
      if (networkStatus.isOnline) {
        updateNetworkStatus(false);
      }
      return false;
    }
  };

  const updateNetworkStatus = (isOnline: boolean) => {
    setNetworkStatus(prev => {
      const now = new Date();
      // Only consider as having been offline if previously offline
      const wasOffline = !isOnline ? true : prev.isOnline ? false : prev.wasOffline;
      
      // Going from offline to online
      if (isOnline && !prev.isOnline) {
        toast.success('Connection restored', { 
          description: 'You are back online' 
        });
        return {
          isOnline: true,
          wasOffline,
          lastOnlineAt: now,
          lastOfflineAt: prev.lastOfflineAt,
          reconnecting: false
        };
      }
      
      // Going from online to offline
      if (!isOnline && prev.isOnline) {
        toast.error('Connection lost', { 
          description: 'You are currently offline'
        });
        return {
          isOnline: false,
          wasOffline: true,
          lastOnlineAt: prev.lastOnlineAt,
          lastOfflineAt: now,
          reconnecting: false
        };
      }
      
      // Status hasn't changed
      return prev;
    });
  };

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser reports online status');
      updateNetworkStatus(true);
    };

    const handleOffline = () => {
      console.log('Browser reports offline status');
      updateNetworkStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();
    
    // Periodic check every 30 seconds when tab is active
    let intervalId: number;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, check connection immediately
        checkConnection();
        // Then set up periodic checks
        intervalId = window.setInterval(checkConnection, 30000);
      } else {
        // When tab is hidden, clear the interval
        clearInterval(intervalId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial setup based on current visibility
    handleVisibilityChange();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ status: networkStatus, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};
