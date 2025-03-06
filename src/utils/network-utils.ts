
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
  let attempts = 0;
  
  while (attempts <= maxRetries) {
    try {
      // Add a small random delay before each attempt to avoid resource contention
      if (attempts > 0) {
        const jitter = Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, jitter));
      }
      
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempts + 1}/${maxRetries + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't wait after the last attempt
      if (attempts < maxRetries) {
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, attempts) * (0.5 + Math.random() * 0.5);
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      attempts++;
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
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')
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
  
  if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
    return 'Your browser has insufficient resources to complete this request. Try refreshing the page or closing some tabs.';
  }
  
  return errorMessage;
}

// Type definition for API responses from Edge Functions
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    details?: string;
    statusCode?: number;
  };
  success?: boolean;
}

// Rate limiting utility to prevent too many concurrent requests
const activeRequests = new Map<string, number>();
const MAX_CONCURRENT_REQUESTS = 3;

/**
 * Limits the number of concurrent requests to the same endpoint
 * @param key - Unique key to identify the request type
 * @param operation - The operation to perform
 * @returns Result of the operation
 */
export async function withRateLimit<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  const currentCount = activeRequests.get(key) || 0;
  
  if (currentCount >= MAX_CONCURRENT_REQUESTS) {
    throw new Error(`Too many concurrent requests to ${key}. Please try again later.`);
  }
  
  activeRequests.set(key, currentCount + 1);
  
  try {
    return await operation();
  } finally {
    const newCount = (activeRequests.get(key) || 1) - 1;
    if (newCount <= 0) {
      activeRequests.delete(key);
    } else {
      activeRequests.set(key, newCount);
    }
  }
}
