
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
  
  // Network-related error patterns
  const networkPatterns = [
    'network',
    'internet',
    'connection',
    'offline',
    'failed to fetch',
    'cors',
    'timeout',
    'aborted',
    'socket',
    'dns',
    'fetch',
    'ssl',
    'handshake',
    'econnrefused',
    'enotfound'
  ];
  
  return networkPatterns.some(pattern => message.includes(pattern));
}

/**
 * Gets a user-friendly message for a network error
 * @param error Any error object
 * @returns A user-friendly error message
 */
export function getNetworkErrorMessage(error: any): string {
  if (!isNetworkError(error)) {
    return 'An unexpected error occurred';
  }
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('offline') || message.includes('internet')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again later.';
  }
  
  if (message.includes('cors')) {
    return 'A cross-origin error occurred. This might be a temporary issue.';
  }
  
  if (message.includes('dns')) {
    return 'Unable to resolve the server address. Please check your connection.';
  }
  
  return 'A network error occurred. Please check your connection and try again.';
}
