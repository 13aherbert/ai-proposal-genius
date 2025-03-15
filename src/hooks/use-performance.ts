
import { useEffect, useRef } from 'react';
import { trackComponentMount, trackComponentRender } from '@/utils/performance/component-timing';

/**
 * Hook to track component performance metrics
 * @param componentName Name of the component being tracked
 * @returns Object containing performance tracking functions
 */
export function usePerformance(componentName: string) {
  const mountTimeRef = useRef<number>(performance.now());
  const renderTimeRef = useRef<number>(performance.now());
  const isMountedRef = useRef<boolean>(false);
  
  // Track component mount time
  useEffect(() => {
    const mountDuration = performance.now() - mountTimeRef.current;
    trackComponentMount(componentName, mountDuration);
    isMountedRef.current = true;
    
    // Track when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, [componentName]);
  
  // Track each render
  useEffect(() => {
    if (isMountedRef.current) {
      const renderDuration = performance.now() - renderTimeRef.current;
      
      // Only track re-renders, not the initial render
      if (renderDuration < 1000) { // Filter out suspiciously long times that might be from dev mode hot reloading
        console.debug(`Component ${componentName} re-rendered in ${renderDuration.toFixed(2)}ms`);
      }
    }
    
    // Reset render time for next render
    renderTimeRef.current = performance.now();
  });
  
  // Start tracking this render
  const finishRenderTracking = trackComponentRender(componentName);
  
  // Call this at the end of the render function
  const trackRender = () => {
    finishRenderTracking();
  };
  
  return {
    trackRender
  };
}
