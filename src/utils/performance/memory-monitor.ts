
/**
 * Utilities for monitoring memory usage and performance
 */

interface MemoryStats {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  usedPercentage?: number;
}

type MemoryAlert = 'warning' | 'critical';
type MemoryAlertCallback = (type: MemoryAlert, stats: MemoryStats) => void;

const memoryAlertCallbacks: MemoryAlertCallback[] = [];

/**
 * Get current memory stats if available
 */
export function getMemoryStats(): MemoryStats | null {
  // Memory API is non-standard and only available in some browsers
  if (!performance || !('memory' in performance)) {
    return null;
  }
  
  // TypeScript doesn't recognize this API, so we need to cast
  const memory = (performance as any).memory;
  if (!memory) {
    return null;
  }
  
  const stats: MemoryStats = {
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
  };
  
  if (stats.jsHeapSizeLimit && stats.usedJSHeapSize) {
    stats.usedPercentage = (stats.usedJSHeapSize / stats.jsHeapSizeLimit) * 100;
  }
  
  return stats;
}

/**
 * Set up periodic memory monitoring
 */
export function startMemoryMonitoring(
  intervalMs = 10000,
  warningThreshold = 70,
  criticalThreshold = 85
) {
  if (!('memory' in performance)) {
    console.warn('Memory API not available in this browser');
    return () => {}; // Return no-op cleanup function
  }
  
  const intervalId = setInterval(() => {
    const stats = getMemoryStats();
    
    if (stats && stats.usedPercentage !== undefined) {
      if (stats.usedPercentage > criticalThreshold) {
        console.error(`CRITICAL MEMORY USAGE: ${stats.usedPercentage.toFixed(1)}%`);
        triggerMemoryAlert('critical', stats);
      } else if (stats.usedPercentage > warningThreshold) {
        console.warn(`HIGH MEMORY USAGE: ${stats.usedPercentage.toFixed(1)}%`);
        triggerMemoryAlert('warning', stats);
      }
      
      // Log to console in development
      if (import.meta.env.DEV) {
        console.debug(`Memory usage: ${(stats.usedJSHeapSize! / (1024 * 1024)).toFixed(1)}MB / ${(stats.jsHeapSizeLimit! / (1024 * 1024)).toFixed(1)}MB (${stats.usedPercentage.toFixed(1)}%)`);
      }
    }
  }, intervalMs);
  
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Register a callback for memory alerts
 */
export function onMemoryAlert(callback: MemoryAlertCallback) {
  memoryAlertCallbacks.push(callback);
  
  // Return function to remove the callback
  return () => {
    const index = memoryAlertCallbacks.indexOf(callback);
    if (index >= 0) {
      memoryAlertCallbacks.splice(index, 1);
    }
  };
}

/**
 * Trigger memory alert for all registered callbacks
 */
function triggerMemoryAlert(type: MemoryAlert, stats: MemoryStats) {
  memoryAlertCallbacks.forEach(callback => {
    try {
      callback(type, stats);
    } catch (err) {
      console.error('Error in memory alert callback:', err);
    }
  });
}

/**
 * Force garbage collection if exposed in this environment
 * This is primarily for development/debugging
 */
export function attemptGarbageCollection() {
  if (window.gc) {
    try {
      window.gc();
      return true;
    } catch (e) {
      console.warn('Failed to trigger garbage collection:', e);
      return false;
    }
  }
  return false;
}
