
/**
 * Utility functions for detecting and handling network errors
 */

/**
 * Check if an error is related to network connectivity issues
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  
  // Check for network unavailability
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  
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
    errorString.includes('429') ||
    // Supabase specific errors
    errorString.includes('service unavailable') ||
    errorString.includes('service temporarily unavailable') ||
    errorString.includes('unreachable') ||
    // Edge function errors
    errorString.includes('edge function') ||
    // Fetch AbortError
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Get a user-friendly message for network errors
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  const errorString = String(error).toLowerCase();
  
  if (!navigator.onLine || errorString.includes('offline') || errorString.includes('network')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  if (errorString.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  
  if (errorString.includes('429') || errorString.includes('too many')) {
    return 'Too many requests. Please try again in a moment.';
  }
  
  if (errorString.includes('503') || errorString.includes('504') || errorString.includes('unavailable') || errorString.includes('unreachable')) {
    return 'Service temporarily unavailable. We\'re using cached data if available.';
  }
  
  if (errorString.includes('edge function')) {
    return 'Connection to backend services failed. Using cached data if available.';
  }
  
  // Default message
  return 'A network error occurred. We\'re using cached data if available.';
}

/**
 * Cache the online status to avoid constant checking
 */
export function isUserOnline(): boolean {
  // Check the browser's online status first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  
  // Also check if we have a cached status
  try {
    const cachedStatus = localStorage.getItem('networkStatus');
    if (cachedStatus === 'offline') {
      return false;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return true;
}

/**
 * Set the cached online status
 */
export function setUserOnlineStatus(isOnline: boolean): void {
  try {
    localStorage.setItem('networkStatus', isOnline ? 'online' : 'offline');
  } catch (e) {
    // Ignore localStorage errors
  }
}
