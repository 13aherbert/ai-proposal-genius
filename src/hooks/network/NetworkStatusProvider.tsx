
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
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
  const networkStatusRef = useRef(networkStatus);
  networkStatusRef.current = networkStatus;

  const updateNetworkStatus = useCallback((isOnline: boolean) => {
    setNetworkStatus(prev => {
      const now = new Date();
      const wasOffline = !isOnline ? true : prev.isOnline ? false : prev.wasOffline;

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

      return prev;
    });
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    try {
      const response = await fetch(`/favicon.ico?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const isOnline = response.ok;

      if (isOnline !== networkStatusRef.current.isOnline) {
        updateNetworkStatus(isOnline);
      }

      return isOnline;
    } catch (error) {
      if (networkStatusRef.current.isOnline) {
        updateNetworkStatus(false);
      }
      return false;
    }
  }, [updateNetworkStatus]);

  useEffect(() => {
    const handleOnline = () => updateNetworkStatus(true);
    const handleOffline = () => updateNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnection();

    let intervalId: number;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
        intervalId = window.setInterval(checkConnection, 30000);
      } else {
        clearInterval(intervalId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [checkConnection, updateNetworkStatus]);

  const contextValue = useMemo<NetworkContextType>(() => ({
    status: networkStatus,
    checkConnection,
  }), [networkStatus, checkConnection]);

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};
