
import { useEffect, useRef } from 'react';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { trackComponentRender } from '@/utils/performance/component-timing';
import { collectResourceTiming } from '@/utils/performance/network-timing';

interface PerformanceMonitorProps {
  componentName?: string;
  monitorRender?: boolean;
  monitorNetwork?: boolean;
}

export function PerformanceMonitor({ 
  componentName,
  monitorRender = true,
  monitorNetwork = false
}: PerformanceMonitorProps) {
  const { trackPerformance, trackRenderTime } = useErrorTracking();
  const intervalRef = useRef<number | null>(null);
  
  // Track component render time
  useEffect(() => {
    if (!monitorRender || !componentName) return;
    
    // Create a finish function that will be called when the component unmounts
    const finishTracking = trackRenderTime(componentName);
    
    // Start tracking this render
    if (monitorRender && componentName) {
      trackComponentRender(componentName)();
    }
    
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
    
    // Set up network resource monitoring
    if (monitorNetwork) {
      const monitorResources = () => {
        const resources = collectResourceTiming();
        resources.forEach(resource => {
          const { name, initiatorType, duration } = resource;
          
          // Only track resources with meaningful durations
          if (duration > 0) {
            trackPerformance({
              name: `resource-${initiatorType}`,
              value: duration,
              unit: 'ms',
              context: {
                url: name.split('?')[0], // Remove query params for privacy
                type: initiatorType
              }
            });
          }
        });
      };
      
      // Initial check and set interval
      monitorResources();
      intervalRef.current = window.setInterval(monitorResources, 10000);
    }
    
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [componentName, monitorNetwork, trackPerformance]);
  
  // Component doesn't render anything
  return null;
}
