/**
 * Performs an operation with retry capability and exponential backoff
 * @param operation - The function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds between retries
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T> | T,
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
      
      // If it's a resource error, add extra delay
      if (isNetworkError(error) && 
          String(error).includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.log('Resource limit reached, adding extra delay before retry');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
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
const requestQueue = new Map<string, Promise<any>[]>();

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
    console.log(`Rate limit exceeded for ${key}, queueing or rejecting...`);
    
    // If we're already at the queue limit, just reject
    const queue = requestQueue.get(key) || [];
    if (queue.length > 5) {
      throw new Error(`Too many queued requests to ${key}. Please try again later.`);
    }
    
    // Otherwise, create a promise that will resolve when a slot is available
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Clean up and reject if it takes too long
        const index = queue.indexOf(queuePromise);
        if (index > -1) queue.splice(index, 1);
        reject(new Error(`Request to ${key} timed out while waiting in queue.`));
      }, 30000); // 30 second timeout
      
      const queuePromise = withRateLimit(key, operation)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
      
      queue.push(queuePromise);
      requestQueue.set(key, queue);
    });
  }
  
  activeRequests.set(key, currentCount + 1);
  
  try {
    return await operation();
  } finally {
    const newCount = (activeRequests.get(key) || 1) - 1;
    if (newCount <= 0) {
      activeRequests.delete(key);
      
      // Process the next queued request if any
      const queue = requestQueue.get(key) || [];
      if (queue.length > 0) {
        // Just remove the promise, it will execute on its own
        queue.shift();
        requestQueue.set(key, queue);
      } else {
        requestQueue.delete(key);
      }
    } else {
      activeRequests.set(key, newCount);
    }
  }
}
