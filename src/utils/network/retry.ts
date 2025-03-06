
/**
 * Performs an operation with retry capability and exponential backoff
 * @param operation - The function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds between retries
 * @returns The result of the operation
 */
import { isNetworkError } from './error-detection';

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
        console.log(`withRetry: Starting attempt ${attempts + 1} with jitter ${jitter.toFixed(2)}ms`);
      } else {
        console.log(`withRetry: Starting first attempt`);
      }
      
      const result = await operation();
      console.log(`withRetry: Operation succeeded after ${attempts + 1} attempt(s)`);
      return result;
    } catch (error) {
      console.warn(`withRetry: Operation failed (attempt ${attempts + 1}/${maxRetries + 1}):`, error);
      
      if (error instanceof Error) {
        console.log(`withRetry: Error type: ${error.name}, Message: ${error.message}`);
        lastError = error;
      } else {
        console.log(`withRetry: Non-Error object caught:`, error);
        lastError = new Error(String(error));
      }
      
      // If it's a resource error, add extra delay
      if (isNetworkError(error) && 
          String(error).includes('ERR_INSUFFICIENT_RESOURCES')) {
        console.log('withRetry: Resource limit reached, adding extra delay before retry');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Don't wait after the last attempt
      if (attempts < maxRetries) {
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, attempts) * (0.5 + Math.random() * 0.5);
        console.log(`withRetry: Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      attempts++;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error(`withRetry: All ${maxRetries + 1} attempts failed, giving up:`, lastError);
  throw lastError;
}
