
import { useNetworkStatus } from './NetworkStatusProvider';

/**
 * Hook to provide network status and utilities to components
 */
export function useNetwork() {
  const { status, checkConnection } = useNetworkStatus();
  
  /**
   * Execute a network operation with offline awareness
   * 
   * @param operation The async operation to perform
   * @param offlineFallback Optional fallback value to return when offline
   * @returns Result of the operation or fallback value
   */
  const withNetworkCheck = async <T>(
    operation: () => Promise<T>,
    offlineFallback?: T
  ): Promise<T> => {
    // Check connection before attempting operation
    const isOnline = await checkConnection();
    
    if (!isOnline) {
      console.log('Network operation attempted while offline');
      if (offlineFallback !== undefined) {
        return offlineFallback;
      }
      throw new Error('Network operation failed: You are offline');
    }
    
    return operation();
  };
  
  return {
    isOnline: status.isOnline,
    wasOffline: status.wasOffline,
    lastOnlineAt: status.lastOnlineAt,
    lastOfflineAt: status.lastOfflineAt,
    reconnecting: status.reconnecting,
    checkConnection,
    withNetworkCheck
  };
}

// Export the provider for convenience
export { NetworkStatusProvider } from './NetworkStatusProvider';
