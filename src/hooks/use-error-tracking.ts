
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ErrorTrackingService, { ErrorData, ErrorSeverity, PerformanceMetric } from '@/services/ErrorTrackingService';

export function useErrorTracking() {
  const { session } = useAuth();
  const errorService = ErrorTrackingService.getInstance();
  
  // Initialize the error tracking service on first use
  useEffect(() => {
    // Check for Sentry DSN from environment variables
    const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
    
    errorService.initialize({
      enableSentry: !!sentryDSN,
      sentryDSN
    });
    
    // Cleanup function
    return () => {
      // No cleanup needed for now
    };
  }, [errorService]);

  // Track an error with the current user context
  const trackError = useCallback((
    error: Omit<ErrorData, 'timestamp' | 'userId'> & { timestamp?: Date }
  ) => {
    errorService.captureError({
      ...error,
      userId: session?.user?.id,
    });
  }, [errorService, session]);

  // Track a performance metric
  const trackPerformance = useCallback((metric: Omit<PerformanceMetric, 'timestamp'> & { timestamp?: Date }) => {
    errorService.trackPerformanceMetric({
      ...metric,
      timestamp: metric.timestamp || new Date()
    });
  }, [errorService]);

  // Register an alert callback
  const onCriticalError = useCallback((callback: (error: ErrorData) => void) => {
    errorService.onAlert(callback);
  }, [errorService]);

  // Utility to track component render time
  const trackRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      errorService.trackPerformanceMetric({
        name: `component-render-${componentName}`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        context: { componentName }
      });
    };
  }, [errorService]);

  return {
    trackError,
    trackPerformance,
    onCriticalError,
    trackRenderTime,
    ErrorSeverity,
  };
}
