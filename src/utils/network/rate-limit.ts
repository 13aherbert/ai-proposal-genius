// Rate limiting utility to prevent too many concurrent requests
const activeRequests = new Map<string, number>();
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue = new Map<string, (() => Promise<any>)[]>();

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
        const index = queue.indexOf(queuedOperation);
        if (index > -1) queue.splice(index, 1);
        reject(new Error(`Request to ${key} timed out while waiting in queue.`));
      }, 30000); // 30 second timeout
      
      // Create the operation to be queued - IMPORTANT: do NOT call withRateLimit again!
      const queuedOperation = async () => {
        try {
          // Mark this request as active
          const currentCount = activeRequests.get(key) || 0;
          activeRequests.set(key, currentCount + 1);
          
          // Execute the original operation
          const result = await operation();
          resolve(result);
          return result;
        } catch (err) {
          reject(err);
          throw err;
        } finally {
          // Clean up after the operation completes
          const newCount = (activeRequests.get(key) || 1) - 1;
          if (newCount <= 0) {
            activeRequests.delete(key);
            
            // Process the next queued operation if there is one
            const nextQueue = requestQueue.get(key) || [];
            if (nextQueue.length > 0) {
              const nextOperation = nextQueue.shift()!;
              nextOperation().catch(console.error);
              
              if (nextQueue.length === 0) {
                requestQueue.delete(key);
              } else {
                requestQueue.set(key, nextQueue);
              }
            }
          } else {
            activeRequests.set(key, newCount);
          }
          
          // Clear the timeout
          clearTimeout(timeoutId);
        }
      };
      
      // Add to queue
      queue.push(queuedOperation);
      requestQueue.set(key, queue);
      
      // If this is the first item in the queue, execute it when a slot becomes available
      if (queue.length === 1) {
        const checkAndExecute = () => {
          const currentCount = activeRequests.get(key) || 0;
          if (currentCount < MAX_CONCURRENT_REQUESTS) {
            const operation = queue.shift()!;
            operation().catch(console.error);
            
            if (queue.length === 0) {
              requestQueue.delete(key);
            } else {
              requestQueue.set(key, queue);
              setTimeout(checkAndExecute, 100);
            }
          } else {
            // Check again after a short delay
            setTimeout(checkAndExecute, 100);
          }
        };
        
        setTimeout(checkAndExecute, 100);
      }
    });
  }
  
  // If under the limit, execute immediately
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
        const nextOperation = queue.shift()!;
        nextOperation().catch(console.error);
        
        if (queue.length === 0) {
          requestQueue.delete(key);
        } else {
          requestQueue.set(key, queue);
        }
      }
    } else {
      activeRequests.set(key, newCount);
    }
  }
}
