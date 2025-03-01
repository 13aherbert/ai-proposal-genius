
import { debounce as _debounce } from "lodash";

/**
 * Creates a debounced version of a function that delays invoking the function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param options Options for the debounce function
 * @returns A debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait = 300,
  options = {}
): T & { cancel: () => void; flush: () => void } => {
  return _debounce(func, wait, options);
};

/**
 * Creates a throttled version of a function that only invokes the function
 * at most once per every `wait` milliseconds.
 * 
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @param options Options for the throttle function
 * @returns A throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait = 300,
  options = {}
): T & { cancel: () => void; flush: () => void } => {
  return _debounce(func, wait, { leading: true, trailing: true, ...options });
};

/**
 * Measures the execution time of a function for performance monitoring
 * 
 * @param fn The function to measure
 * @param name An optional name for logging purposes
 * @returns The result of the function
 */
export function measurePerformance<T>(fn: () => T, name = 'Function'): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const end = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    }
  }
}

/**
 * Adds a configurable delay to a Promise for testing loading states
 * (only in development mode)
 * 
 * @param promise The promise to delay
 * @param ms The number of milliseconds to delay
 * @returns A delayed promise
 */
export async function addDevDelay<T>(promise: Promise<T>, ms = 500): Promise<T> {
  const result = await promise;
  
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
  
  return result;
}

/**
 * Creates a memoized version of a function that caches the result
 * for the given arguments
 * 
 * @param fn The function to memoize
 * @param getKey Function to generate a cache key from the arguments
 * @returns A memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
