
import { useState, useEffect } from 'react';
import { setupNetworkListeners } from '@/utils/network/offline-detection';

/**
 * Hook for managing network connectivity status
 * Detects online/offline state and provides status information
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const cleanup = setupNetworkListeners((online) => {
      setIsOffline(!online);
    });
    
    return cleanup;
  }, []);
  
  return { isOffline };
}
