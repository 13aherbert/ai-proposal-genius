
type OperationFunction<T> = () => Promise<T>;

/**
 * Map to store the last execution time of operations
 */
const operationTimestamps: Map<string, number> = new Map();

/**
 * Executes an operation with rate limiting
 * 
 * @param operation The function to execute
 * @param key A unique key to identify this operation for rate limiting
 * @param minInterval Minimum time (in ms) that must pass between executions
 * @returns The result of the operation
 */
export async function withRateLimit<T>(
  operation: OperationFunction<T>,
  key: string,
  minInterval: number = 5000
): Promise<T> {
  const now = Date.now();
  const lastExecutionTime = operationTimestamps.get(key) || 0;
  const timeSinceLastExecution = now - lastExecutionTime;
  
  // If the operation was executed recently, wait for the minimum interval
  if (timeSinceLastExecution < minInterval) {
    const waitTime = minInterval - timeSinceLastExecution;
    console.log(`Rate limiting operation '${key}': waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update the last execution time and perform the operation
  operationTimestamps.set(key, Date.now());
  return operation();
}

/**
 * Helper function overload for withRateLimit that accepts a key first
 * This makes it easier to use for common cases
 * 
 * @param key A unique key to identify this operation for rate limiting
 * @param asyncCallback The async function to execute
 * @param minInterval Minimum time (in ms) that must pass between executions
 * @returns The result of the operation
 */
export async function withRateLimit<T>(
  key: string,
  asyncCallback: () => Promise<T>,
  minInterval?: number
): Promise<T> {
  return withRateLimit(asyncCallback, key, minInterval);
}

/**
 * Wrapper for withRateLimit that creates an operation function from a key
 * This is for backward compatibility with code that passes a string key
 */
export async function withRateLimitByKey<T>(
  key: string,
  asyncCallback: () => Promise<T>,
  minInterval: number = 5000
): Promise<T> {
  return withRateLimit(() => asyncCallback(), key, minInterval);
}
