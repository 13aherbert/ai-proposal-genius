
import { isNetworkError } from './error-detection';

/**
 * Retry a function with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 * @param maxDelay Maximum delay in ms
 * @returns The result of the function or throws an error after all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: unknown;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Only retry network errors, for other errors just throw
      if (!isNetworkError(error) && attempt > 0) {
        throw error;
      }
      
      if (attempt >= maxRetries) {
        break;
      }
      
      // Wait with exponential backoff 
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt, but don't exceed maxDelay
      delay = Math.min(delay * 2, maxDelay);
    }
  }
  
  throw lastError;
}
