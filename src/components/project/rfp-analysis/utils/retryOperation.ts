/**
 * Retries an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @returns The result of the operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 2
): Promise<T> {
  let currentRetry = 0;

  const attempt = async (): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (currentRetry < maxRetries) {
        currentRetry++;
        const delay = 1000 * currentRetry;
        console.log(`Retry attempt ${currentRetry} failed, waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt();
      }
      throw error;
    }
  };

  return attempt();
}