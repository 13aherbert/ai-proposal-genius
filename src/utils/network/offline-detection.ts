
// This file handles network status detection and events

/**
 * Setup event listeners for online/offline status
 * @param callback Function to call when online status changes
 * @returns Cleanup function to remove event listeners
 */
export function setupNetworkListeners(callback: (online: boolean) => void) {
  // Set initial state
  const initialOnlineStatus = navigator.onLine;
  console.log(`Browser reports online status`, initialOnlineStatus);
  callback(initialOnlineStatus);
  
  // Create handlers for network status changes
  const handleOnline = () => {
    console.log("Network connection restored");
    callback(true);
  };
  
  const handleOffline = () => {
    console.log("Network connection lost");
    callback(false);
  };

  // Add event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Periodic connectivity check for more reliable detection
  const checkInterval = setInterval(() => {
    checkNetworkConnection()
      .then(isConnected => {
        if (isConnected !== navigator.onLine) {
          console.log(`Actual connection status (${isConnected}) differs from browser reported (${navigator.onLine})`);
          callback(isConnected);
        }
      })
      .catch(() => {
        // If check fails, assume offline
        if (navigator.onLine) {
          console.log("Network check failed, treating as offline despite browser reporting online");
          callback(false);
        }
      });
  }, 30000); // Check every 30 seconds
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(checkInterval);
  };
}

/**
 * Utility to check if an error is a network error
 * @param error Error to check
 * @returns boolean indicating if it's a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check common network error patterns
  const errorString = String(error).toLowerCase();
  const messageString = error.message ? String(error.message).toLowerCase() : '';
  
  const networkErrorKeywords = [
    'network', 'offline', 'connection', 'internet',
    'timeout', 'failed to fetch', 'net::err', 'aborted'
  ];
  
  return (
    networkErrorKeywords.some(keyword => errorString.includes(keyword)) ||
    networkErrorKeywords.some(keyword => messageString.includes(keyword)) ||
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    error.type === 'network'
  );
}

/**
 * Check network connection by making a lightweight request
 * @returns Promise resolving to boolean indicating connection status
 */
async function checkNetworkConnection(): Promise<boolean> {
  console.log("Checking network connection...");
  try {
    // Use a tiny request to check connectivity, with cache busting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://bmopbbkfxkgzlbmhhgox.supabase.co/auth/v1/health', {
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("Network connectivity check failed:", error);
    return false;
  }
}
