
import { useEffect } from 'react';
import ErrorTrackingService, { ErrorSeverity } from '@/services/ErrorTrackingService';
import { useToast } from '@/components/ui/use-toast';

export function useMonitoring() {
  const { toast } = useToast();
  const errorService = ErrorTrackingService.getInstance();
  
  useEffect(() => {
    // Initialize the error tracking service
    const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
    
    errorService.initialize({
      enableSentry: !!sentryDSN,
      sentryDSN
    });
    
    // Set up critical error alerts
    errorService.onAlert((error) => {
      if (error.severity === ErrorSeverity.CRITICAL) {
        // Show a prominent UI notification for critical errors
        toast({
          title: "Critical System Error",
          description: `${error.message}. Our team has been notified.`,
          variant: "destructive",
        });
        
        // In a production app, you could also trigger other alerts here
        // like sending emails, Slack notifications, etc.
      }
    });
    
    // Set up periodic sync to backend
    const syncInterval = setInterval(() => {
      errorService.sendErrorsToBackend().catch(err => {
        console.error('Failed to sync errors to backend:', err);
      });
    }, 60000); // Every minute
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [errorService, toast]);
}
