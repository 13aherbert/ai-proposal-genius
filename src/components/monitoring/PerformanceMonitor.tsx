
import { useEffect } from 'react';
import { useErrorTracking } from '@/hooks/use-error-tracking';

interface PerformanceMonitorProps {
  componentName?: string;
  monitorRender?: boolean;
}

export function PerformanceMonitor({ 
  componentName,
  monitorRender = true
}: PerformanceMonitorProps) {
  const { trackPerformance, trackRenderTime } = useErrorTracking();
  
  // Track component render time
  useEffect(() => {
    if (!monitorRender || !componentName) return;
    
    // Create a finish function that will be called when the component unmounts
    const finishTracking = trackRenderTime(componentName);
    
    // Return cleanup function
    return finishTracking;
  }, [componentName, monitorRender, trackRenderTime]);
  
  // Track route navigation timing
  useEffect(() => {
    if (!componentName) return;
    
    // Get navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      trackPerformance({
        name: `route-navigation-${componentName}`,
        value: navTiming.loadEventEnd - navTiming.startTime,
        unit: 'ms',
        context: {
          route: window.location.pathname,
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
          domComplete: navTiming.domComplete - navTiming.startTime
        }
      });
    }
    
    // Track memory usage if available
    if ('memory' in performance) {
      // TypeScript doesn't know about this property, so we need to cast
      const memory = (performance as any).memory;
      if (memory) {
        trackPerformance({
          name: 'memory-usage',
          value: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
          unit: 'bytes',
          context: { 
            totalJSHeapSize: memory.totalJSHeapSize,
            JSHeapSizeLimit: memory.jsHeapSizeLimit,
            route: window.location.pathname
          }
        });
      }
    }
  }, [componentName, trackPerformance]);
  
  // Component doesn't render anything
  return null;
}
