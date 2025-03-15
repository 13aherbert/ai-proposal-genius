/**
 * Utility for tracking component rendering performance
 */

interface ComponentTimingData {
  componentName: string;
  renderCount: number;
  mountDuration: number | null;
  lastRenderDuration: number | null;
  totalRenderTime: number;
  renderTimestamps: number[];
}

// Store component timing data
const componentTimings: Record<string, ComponentTimingData> = {};

/**
 * Track the mount time of a component
 * @param componentName The name of the component
 * @param duration The duration of the mount
 */
export function trackComponentMount(componentName: string, duration: number) {
  if (!componentTimings[componentName]) {
    componentTimings[componentName] = {
      componentName,
      renderCount: 0,
      mountDuration: null,
      lastRenderDuration: null,
      totalRenderTime: 0,
      renderTimestamps: []
    };
  }
  
  componentTimings[componentName].mountDuration = duration;
}

/**
 * Start tracking a component render
 * @param componentName The name of the component
 * @returns Function to call when render is complete
 */
export function trackComponentRender(componentName: string): () => void {
  const startTime = performance.now();
  
  if (!componentTimings[componentName]) {
    componentTimings[componentName] = {
      componentName,
      renderCount: 0,
      mountDuration: null,
      lastRenderDuration: null,
      totalRenderTime: 0,
      renderTimestamps: []
    };
  }
  
  // Return function to call when render is complete
  return () => {
    const duration = performance.now() - startTime;
    const timing = componentTimings[componentName];
    
    timing.renderCount++;
    timing.lastRenderDuration = duration;
    timing.totalRenderTime += duration;
    timing.renderTimestamps.push(performance.now());
    
    // Keep only the last 10 timestamps
    if (timing.renderTimestamps.length > 10) {
      timing.renderTimestamps.shift();
    }
    
    // Log slow renders (over 16ms - equivalent to 60fps)
    if (duration > 16) {
      console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Get render statistics for all tracked components
 */
export function getComponentRenderStats() {
  return Object.values(componentTimings).map(timing => ({
    componentName: timing.componentName,
    renderCount: timing.renderCount,
    averageRenderTime: timing.renderCount > 0 
      ? timing.totalRenderTime / timing.renderCount 
      : 0,
    lastRenderDuration: timing.lastRenderDuration,
    mountDuration: timing.mountDuration,
    reRenderFrequency: calculateReRenderFrequency(timing.renderTimestamps)
  }));
}

/**
 * Calculate how frequently a component is re-rendering
 * @param timestamps Array of render timestamps
 * @returns Average time between renders in ms, or null if not enough data
 */
function calculateReRenderFrequency(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null;
  
  let totalGap = 0;
  for (let i = 1; i < timestamps.length; i++) {
    totalGap += timestamps[i] - timestamps[i-1];
  }
  
  return totalGap / (timestamps.length - 1);
}

/**
 * Clear all component timing data
 */
export function clearComponentTimings() {
  Object.keys(componentTimings).forEach(key => {
    delete componentTimings[key];
  });
}
