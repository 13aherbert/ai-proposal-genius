
/**
 * Performs an operation with retry capability and exponential backoff
 * @param operation - The function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds between retries
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

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
    errorMessage.includes('ERR_CONNECTION_REFUSED')
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
  
  if (errorMessage.includes('Failed to fetch')) {
    return 'Network error: Unable to connect to the server. Please check your internet connection.';
  }
  
  return errorMessage;
}
