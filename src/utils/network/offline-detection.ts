
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
  
  // Track last event time to debounce multiple events
  let lastEventTime = Date.now();
  let lastStatus = initialOnlineStatus;
  
  // Create handlers for network status changes with debouncing
  const handleOnline = () => {
    const now = Date.now();
    // Debounce events within 2 seconds and ignore if status hasn't changed
    if (now - lastEventTime < 2000 || lastStatus === true) return;
    
    lastEventTime = now;
    lastStatus = true;
    console.log("Network connection restored");
    callback(true);
  };
  
  const handleOffline = () => {
    const now = Date.now();
    // Debounce events within 2 seconds and ignore if status hasn't changed
    if (now - lastEventTime < 2000 || lastStatus === false) return;
    
    lastEventTime = now;
    lastStatus = false;
    console.log("Network connection lost");
    callback(false);
  };

  // Add event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Reduce frequency of periodic connectivity checks
  const checkInterval = setInterval(() => {
    checkNetworkConnection()
      .then(isConnected => {
        // Only trigger callback if status actually changed
        if (isConnected !== lastStatus) {
          console.log(`Actual connection status (${isConnected}) differs from previous status (${lastStatus})`);
          lastStatus = isConnected;
          callback(isConnected);
        }
      })
      .catch(() => {
        // If check fails, only update if we're currently showing as online
        if (lastStatus) {
          console.log("Network check failed, treating as offline despite browser reporting online");
          lastStatus = false;
          callback(false);
        }
      });
  }, 180000); // Check even less frequently (every 3 minutes)
  
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
  try {
    // Use a tiny request to check connectivity, with cache busting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
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
    
    // Consider 401 as a successful connection since it means the service is available
    return response.ok || response.status === 401;
  } catch (error) {
    console.warn("Network connectivity check failed:", error);
    return false;
  }
}
