
/**
 * Utility function to retry an operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Promise with the operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | null = null;
  let retryCount = 0;
  let delay = initialDelay;

  while (retryCount < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;
      
      if (retryCount >= maxRetries) {
        break;
      }
      
      console.log(`Retry attempt ${retryCount}/${maxRetries} after ${delay}ms`);
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (with max cap)
      delay = Math.min(delay * 2, maxDelay);
    }
  }
  
  throw lastError || new Error("Operation failed after multiple retries");
}

/**
 * Utility function to retry an operation with exponential backoff and timeout
 * @param operation Function to retry
 * @param timeout Timeout in milliseconds
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Promise with the operation result
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  timeout: number = 5000,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  return Promise.race([
    withRetry(operation, maxRetries, initialDelay),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out")), timeout);
    })
  ]);
}
