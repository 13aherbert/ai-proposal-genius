
/**
 * Network error detection utilities
 */

/**
 * Checks if an error is a network-related error
 * @param error Any error object
 * @returns Whether the error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check for common network error messages
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  // Network-related error patterns - be more specific
  const networkPatterns = [
    'failed to fetch',
    'network error',
    'internet connection',
    'connection refused',
    'timeout',
    'dns',
    'socket',
    'ssl',
    'handshake',
    'econnrefused',
    'enotfound',
    'enetunreach',
    'ehostunreach'
  ];
  
  // HTTP status codes that indicate network issues
  const networkStatusCodes = [0, 408, 502, 503, 504];
  
  // Check if it's a genuine network error
  const isNetworkMessage = networkPatterns.some(pattern => 
    message.includes(pattern) || code.includes(pattern)
  );
  
  const isNetworkStatus = error.status && networkStatusCodes.includes(error.status);
  
  // Don't treat normal HTTP errors (4xx, 5xx) as network errors unless they're specific network-related codes
  if (error.status >= 400 && error.status < 600 && !networkStatusCodes.includes(error.status)) {
    return false;
  }
  
  return isNetworkMessage || isNetworkStatus;
}

/**
 * Gets a user-friendly message for a network error
 * @param error Any error object
 * @returns A user-friendly error message
 */
export function getNetworkErrorMessage(error: any): string {
  if (!isNetworkError(error)) {
    return 'An error occurred while loading data';
  }
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (message.includes('dns') || message.includes('enotfound')) {
    return 'Unable to connect to server. Please check your connection.';
  }
  
  if (message.includes('connection refused') || message.includes('econnrefused')) {
    return 'Unable to connect to server. Please try again later.';
  }
  
  return 'Network connection issue. Please check your connection and try again.';
}
