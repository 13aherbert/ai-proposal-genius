
/**
 * Utility functions for detecting and handling network errors
 */

/**
 * Check if an error is related to network connectivity issues
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  
  return (
    // Common network error messages
    errorString.includes('network') ||
    errorString.includes('failed to fetch') ||
    errorString.includes('connection') ||
    errorString.includes('offline') ||
    errorString.includes('aborted') ||
    errorString.includes('timeout') ||
    errorString.includes('cors') ||
    // HTTP errors that might be network related
    errorString.includes('503') ||
    errorString.includes('504') ||
    errorString.includes('429')
  );
}

/**
 * Get a user-friendly message for network errors
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  const errorString = String(error).toLowerCase();
  
  if (errorString.includes('offline') || errorString.includes('network')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  if (errorString.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  
  if (errorString.includes('429') || errorString.includes('too many')) {
    return 'Too many requests. Please try again in a moment.';
  }
  
  if (errorString.includes('503') || errorString.includes('504') || errorString.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Default message
  return 'A network error occurred. Please try again.';
}
