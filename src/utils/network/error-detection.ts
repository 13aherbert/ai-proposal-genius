
/**
 * Checks if the error is related to network connectivity
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || String(error);
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') ||
    // Check for Supabase error codes that might indicate network issues
    (error.code && (
      error.code === 'PGRST301' || // Supabase timeout
      error.code === 'CONNECTION_ERROR'
    ))
  );
}

/**
 * Gets a user-friendly message for network errors
 * @param error - The error object
 * @returns A user-friendly error message
 */
export function getNetworkErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  const errorMessage = error.message || String(error);
  
  if (errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
    return 'DNS resolution error: Unable to connect to the server. Check your internet connection or DNS settings.';
  }
  
  if (errorMessage.includes('ERR_INTERNET_DISCONNECTED')) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (errorMessage.includes('ERR_CONNECTION_REFUSED')) {
    return 'Connection refused. The server may be down or unreachable.';
  }
  
  if (errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('NetworkError') || 
      errorMessage.includes('Network request failed')) {
    return 'Network error: Unable to connect to the server. Please check your internet connection.';
  }
  
  if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
    return 'Your browser has insufficient resources to complete this request. Try refreshing the page or closing some tabs.';
  }
  
  if (error.code === 'PGRST301') {
    return 'The server took too long to respond. Please try again later.';
  }
  
  if (error.code === 'CONNECTION_ERROR') {
    return 'Unable to connect to the database. Please try again later.';
  }
  
  return errorMessage;
}
