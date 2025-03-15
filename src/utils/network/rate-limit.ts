
/**
 * Rate limiting utility functions
 */

// Cache to track rate limited operations
const rateLimitCache: Record<string, { timestamp: number, count: number }> = {};

/**
 * Execute a function with rate limiting based on a key
 * @param key Unique identifier for the rate limited operation
 * @param fn Function to execute if not rate limited
 * @param limit Maximum number of calls in the time window
 * @param windowMs Time window in milliseconds
 * @returns Result of the function or null if rate limited
 */
export async function withRateLimitByKey<T>(
  key: string,
  fn: () => Promise<T>,
  limit: number = 5,
  windowMs: number = 60000
): Promise<T | null> {
  const now = Date.now();
  const cacheEntry = rateLimitCache[key];
  
  // Initialize or clean expired cache entry
  if (!cacheEntry || (now - cacheEntry.timestamp > windowMs)) {
    rateLimitCache[key] = { timestamp: now, count: 0 };
  }
  
  // Check if rate limit is exceeded
  if (rateLimitCache[key].count >= limit) {
    console.warn(`Rate limit exceeded for key: ${key}`);
    return null;
  }
  
  // Increment counter and execute function
  rateLimitCache[key].count++;
  
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in rate-limited function (${key}):`, error);
    throw error;
  }
}

/**
 * Clear rate limit cache for testing purposes
 */
export function clearRateLimitCache() {
  Object.keys(rateLimitCache).forEach(key => {
    delete rateLimitCache[key];
  });
}
