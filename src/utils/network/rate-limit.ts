
type OperationFunction<T> = () => Promise<T>;

/**
 * Map to store the last execution time of operations
 */
const operationTimestamps: Map<string, number> = new Map();

/**
 * Executes an operation with rate limiting
 * 
 * @param operationOrKey The function to execute or a key for the operation
 * @param keyOrCallback A unique key to identify this operation for rate limiting or the callback function
 * @param minInterval Minimum time (in ms) that must pass between executions
 * @returns The result of the operation
 */
export async function withRateLimit<T>(
  operation: OperationFunction<T>,
  key: string,
  minInterval?: number
): Promise<T>;

export async function withRateLimit<T>(
  key: string,
  asyncCallback: OperationFunction<T>,
  minInterval?: number
): Promise<T>;

export async function withRateLimit<T>(
  operationOrKey: OperationFunction<T> | string,
  keyOrCallback: string | OperationFunction<T>,
  minInterval: number = 5000
): Promise<T> {
  let operation: OperationFunction<T>;
  let key: string;
  
  // Handle overload cases
  if (typeof operationOrKey === 'string') {
    // First argument is a key string
    key = operationOrKey;
    operation = keyOrCallback as OperationFunction<T>;
  } else {
    // First argument is a function
    operation = operationOrKey;
    key = keyOrCallback as string;
  }
  
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
