
/**
 * Optimized fetch utilities with performance tracking and caching
 */
import { trackFetchTiming } from './network-timing';

interface OptimizedFetchOptions extends RequestInit {
  cacheStrategy?: 'default' | 'no-cache' | 'force-cache' | 'only-if-cached';
  cacheTtl?: number; // Time to live in milliseconds
  retries?: number;
}

// In-memory cache for requests
const requestCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

/**
 * Performs an optimized fetch with performance tracking and caching
 */
export async function optimizedFetch<T = any>(
  url: string, 
  options: OptimizedFetchOptions = {}
): Promise<T> {
  const { 
    cacheStrategy = 'default', 
    cacheTtl = 60000, // Default TTL of 1 minute
    retries = 1,
    ...fetchOptions 
  } = options;
  
  // Generate cache key from URL and any body content
  const cacheKey = getCacheKey(url, fetchOptions);
  
  // Check if we can return from cache
  if (cacheStrategy !== 'no-cache') {
    const cachedResponse = requestCache.get(cacheKey);
    
    if (cachedResponse) {
      const now = Date.now();
      const isExpired = now - cachedResponse.timestamp > cachedResponse.ttl;
      
      if (!isExpired || cacheStrategy === 'only-if-cached') {
        console.debug(`[optimizedFetch] Cache hit for ${url}`);
        return cachedResponse.data;
      } else {
        // Cache expired, remove it
        requestCache.delete(cacheKey);
      }
    }
    
    // If strategy is "only-if-cached" and we don't have it cached, throw error
    if (cacheStrategy === 'only-if-cached') {
      throw new Error('Resource not found in cache and only-if-cached was specified');
    }
  }
  
  // Set up fetch performance tracking
  const timing = trackFetchTiming(url);
  
  // Attempt fetch with retries
  let lastError: Error | undefined;
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Record successful fetch
      timing.success(response.status, false);
      
      // Cache the response if needed
      if (cacheStrategy !== 'no-cache') {
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTtl
        });
      }
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;
      
      console.warn(`[optimizedFetch] Attempt ${attempt} failed for ${url}:`, lastError.message);
      
      if (attempt <= retries) {
        // Wait before next retry, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  // Record failed fetch
  timing.failure(lastError);
  throw lastError;
}

/**
 * Generate a cache key from a URL and fetch options
 */
function getCacheKey(url: string, options: RequestInit): string {
  const { method = 'GET', headers = {}, body } = options;
  
  // Convert headers to string
  let headerStr = '';
  if (headers instanceof Headers) {
    headerStr = JSON.stringify(Array.from(headers.entries()));
  } else if (typeof headers === 'object') {
    headerStr = JSON.stringify(headers);
  }
  
  return `${method}:${url}:${headerStr}:${body ? JSON.stringify(body) : ''}`;
}

/**
 * Clear the in-memory fetch cache
 */
export function clearFetchCache(): void {
  requestCache.clear();
}

/**
 * Remove specific entries from the cache that match a URL pattern
 */
export function invalidateCacheEntries(urlPattern: RegExp | string): number {
  let count = 0;
  
  const pattern = typeof urlPattern === 'string' 
    ? new RegExp(urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    : urlPattern;
  
  requestCache.forEach((_, key) => {
    if (pattern.test(key)) {
      requestCache.delete(key);
      count++;
    }
  });
  
  return count;
}
