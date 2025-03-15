
// This file contains common network utilities

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
 * Get a user-friendly error message for network errors
 * @param error The error object
 * @returns A human-readable error message
 */
export function getNetworkErrorMessage(error: any): string {
  if (!error) return 'Unknown network error';
  
  // If it's a string, just return it
  if (typeof error === 'string') return error;
  
  // If it has a message property, use that
  if (error.message) return error.message;
  
  // Check for specific error types
  if (String(error).includes('timeout') || String(error).includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  
  if (String(error).includes('offline') || String(error).includes('internet')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  // Default message
  return 'A network error occurred. Please try again.';
}
