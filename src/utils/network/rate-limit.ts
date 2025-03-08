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
      
      // Create a callback to execute when a slot becomes available
      // IMPORTANT: We don't call withRateLimit recursively here to avoid stack overflow
      const executeQueuedOperation = async () => {
        try {
          activeRequests.set(key, (activeRequests.get(key) || 0) + 1);
          const result = await operation();
          resolve(result);
          return result;
        } catch (err) {
          reject(err);
          throw err;
        } finally {
          const newCount = (activeRequests.get(key) || 1) - 1;
          if (newCount <= 0) {
            activeRequests.delete(key);
          } else {
            activeRequests.set(key, newCount);
          }
        }
      };
      
      const queuePromise = executeQueuedOperation();
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
