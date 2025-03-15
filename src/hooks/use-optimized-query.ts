
import { useState, useEffect, useCallback } from 'react';
import { optimizedFetch, clearFetchCache, invalidateCacheEntries } from '@/utils/performance/optimized-fetch';

interface UseOptimizedQueryOptions {
  url: string;
  enabled?: boolean;
  refetchInterval?: number | false; 
  cacheTime?: number;
  retries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  initialData?: any;
}

export function useOptimizedQuery<T = any>({
  url,
  enabled = true,
  refetchInterval = false,
  cacheTime = 60000, // 1 minute
  retries = 1,
  onSuccess,
  onError,
  initialData
}: UseOptimizedQueryOptions) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  
  const fetchData = useCallback(async (force = false) => {
    if (!url || (!enabled && !force)) return;
    
    setIsFetching(true);
    if (!data) setIsLoading(true);
    
    try {
      const result = await optimizedFetch<T>(url, {
        cacheStrategy: force ? 'no-cache' : 'default',
        cacheTtl: cacheTime,
        retries
      });
      
      setData(result);
      setError(null);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error(`Query error for ${url}:`, error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [url, enabled, cacheTime, retries, onSuccess, onError, data]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [url, enabled, fetchData]);
  
  // Set up refetch interval if specified
  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    
    const intervalId = setInterval(() => {
      fetchData();
    }, refetchInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refetchInterval, enabled, fetchData]);
  
  // Function to manually refetch
  const refetch = useCallback(() => fetchData(true), [fetchData]);
  
  // Function to invalidate related cache entries
  const invalidateRelatedQueries = useCallback((pattern: RegExp | string) => {
    return invalidateCacheEntries(pattern);
  }, []);
  
  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateRelatedQueries,
  };
}
