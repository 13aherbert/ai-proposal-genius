
/**
 * Utility for tracking and analyzing network request timing
 */

interface TimingEntry {
  url: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  success: boolean | null;
  status?: number;
  cached?: boolean;
}

// Store timing data for analysis
const timingData: TimingEntry[] = [];

// Cache for resource timing data to avoid duplicates
const processedResources = new Set<string>();

/**
 * Track the timing of a fetch request
 * @param url The URL being fetched
 * @returns Object with methods to mark the end of the request
 */
export function trackFetchTiming(url: string): { 
  success: (status?: number, cached?: boolean) => void;
  failure: (error?: Error) => void;
} {
  const entry: TimingEntry = {
    url,
    startTime: performance.now(),
    endTime: null,
    duration: null,
    success: null
  };
  
  timingData.push(entry);
  
  // If more than 100 entries, remove the oldest
  if (timingData.length > 100) {
    timingData.shift();
  }
  
  return {
    success: (status?: number, cached?: boolean) => {
      entry.endTime = performance.now();
      entry.duration = entry.endTime - entry.startTime;
      entry.success = true;
      entry.status = status;
      entry.cached = cached;
    },
    failure: (error?: Error) => {
      entry.endTime = performance.now();
      entry.duration = entry.endTime - entry.startTime;
      entry.success = false;
    }
  };
}

/**
 * Collect performance entries from the browser's Performance API
 */
export function collectResourceTiming() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return [];
  }
  
  const resources = window.performance.getEntriesByType('resource');
  const newEntries = [];
  
  for (const resource of resources) {
    if (!processedResources.has(resource.name)) {
      processedResources.add(resource.name);
      newEntries.push(resource);
    }
  }
  
  return newEntries;
}

/**
 * Get timing statistics for network requests
 */
export function getTimingStats() {
  if (timingData.length === 0) return null;
  
  const completedRequests = timingData.filter(entry => entry.duration !== null);
  if (completedRequests.length === 0) return null;
  
  const successfulRequests = completedRequests.filter(entry => entry.success);
  const failedRequests = completedRequests.filter(entry => !entry.success);
  
  const durations = completedRequests.map(entry => entry.duration || 0);
  const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  
  return {
    totalRequests: completedRequests.length,
    successfulRequests: successfulRequests.length,
    failedRequests: failedRequests.length,
    averageDuration,
    slowestRequest: Math.max(...durations),
    fastestRequest: Math.min(...durations)
  };
}

/**
 * Clear all timing data
 */
export function clearTimingData() {
  timingData.length = 0;
  processedResources.clear();
}
