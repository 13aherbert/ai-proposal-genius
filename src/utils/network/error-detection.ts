
/**
 * Checks if the error is related to network connectivity
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  console.log("isNetworkError checking:", error);
  console.log("Error type:", typeof error);
  if (error instanceof Error) {
    console.log("Error name:", error.name);
  }
  
  // Convert error to string for checking
  const errorMessage = error.message || String(error);
  console.log("Error message for network check:", errorMessage);
  
  const isNetwork = (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') ||
    errorMessage.includes('net::ERR') ||
    errorMessage.includes('Unable to connect') ||
    errorMessage.includes('Connection reset') ||
    errorMessage.includes('Connection closed') ||
    errorMessage.includes('Connection aborted') ||
    errorMessage.includes('Could not connect') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ENOTFOUND') ||
    // Supabase specific error codes
    (error.code && (
      error.code === 'PGRST301' || // Supabase timeout
      error.code === 'CONNECTION_ERROR' ||
      error.code === 'NETWORK_ERROR' ||
      // Additional Supabase/Postgres error codes
      error.code === '08000' || // connection_exception
      error.code === '08003' || // connection_does_not_exist
      error.code === '08006' || // connection_failure
      error.code === '08001' || // sqlclient_unable_to_establish_sqlconnection
      error.code === '08004' || // sqlserver_rejected_establishment_of_sqlconnection
      error.code === '57P01' || // admin_shutdown
      error.code === '57P02' || // crash_shutdown
      error.code === '57P03' || // cannot_connect_now
      error.code === '53300' || // too_many_connections
      typeof error.code === 'string' && error.code.includes('INTERNAL_ERROR')
    ))
  );

  console.log("Is network error result:", isNetwork);
  return isNetwork;
}

/**
 * Gets a user-friendly message for network errors
 * @param error - The error object
 * @returns A user-friendly error message
 */
export function getNetworkErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  console.log("getNetworkErrorMessage for:", error);
  const errorMessage = error.message || String(error);
  console.log("Error message for friendly display:", errorMessage);
  
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
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('Unable to connect')) {
    return 'Network error: Unable to connect to the server. Please check your internet connection.';
  }
  
  if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
    return 'Your browser has insufficient resources to complete this request. Try refreshing the page or closing some tabs.';
  }
  
  if (errorMessage.includes('ETIMEDOUT') || 
      errorMessage.includes('timeout') || 
      error.code === 'PGRST301') {
    return 'The server took too long to respond. Please try again later.';
  }
  
  if (errorMessage.includes('ECONNRESET') || 
      errorMessage.includes('Connection reset') ||
      errorMessage.includes('socket hang up')) {
    return 'The connection was reset. This could be due to network instability or a server issue.';
  }
  
  if (error.code === 'CONNECTION_ERROR' || error.code === 'NETWORK_ERROR') {
    return 'Unable to connect to the database. Please try again later.';
  }
  
  if (typeof error.code === 'string' && (
    error.code.includes('08') || 
    error.code.includes('57P') ||
    error.code.includes('53300')
  )) {
    return 'Database connection issue. The server might be overloaded or temporarily unavailable.';
  }
  
  if (typeof error.code === 'string' && error.code.includes('INTERNAL_ERROR')) {
    return 'Internal server error. Please try again later or contact support if the issue persists.';
  }
  
  return 'Network error: ' + errorMessage;
}
