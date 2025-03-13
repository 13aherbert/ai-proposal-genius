
/**
 * Utilities for rate limiting API calls
 */

const rateLimitCache = new Map<string, number>();

/**
 * Execute a function with rate limiting
 * @param fn The function to execute
 * @param minInterval Minimum time between executions in milliseconds
 * @returns The result of the function
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  minInterval: number = 1000
): Promise<T> {
  const now = Date.now();
  const lastExecutionTime = rateLimitCache.get('_default') || 0;
  
  if (now - lastExecutionTime < minInterval) {
    await new Promise(resolve => setTimeout(resolve, minInterval - (now - lastExecutionTime)));
  }
  
  rateLimitCache.set('_default', Date.now());
  return fn();
}

/**
 * Execute a function with rate limiting by key
 * @param key The key to rate limit on
 * @param fn The function to execute
 * @param minInterval Minimum time between executions in milliseconds
 * @returns The result of the function
 */
export async function withRateLimitByKey<T>(
  key: string,
  fn: () => Promise<T>,
  minInterval: number = 1000
): Promise<T> {
  const now = Date.now();
  const lastExecutionTime = rateLimitCache.get(key) || 0;
  
  if (now - lastExecutionTime < minInterval) {
    await new Promise(resolve => setTimeout(resolve, minInterval - (now - lastExecutionTime)));
  }
  
  rateLimitCache.set(key, Date.now());
  return fn();
}
