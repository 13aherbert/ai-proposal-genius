
import { toast } from "@/components/ui/use-toast";

// Define error severity levels
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical"
}

// Define error data structure
export interface ErrorData {
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  url?: string;
  componentStack?: string;
}

// Define performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'percent' | 'count';
  timestamp: Date;
  context?: Record<string, any>;
}

class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errors: ErrorData[] = [];
  private metrics: PerformanceMetric[] = [];
  private alertCallbacks: ((error: ErrorData) => void)[] = [];
  private isInitialized = false;
  private sentryEnabled = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  // Initialize the service with configuration
  public initialize(config: { 
    enableSentry?: boolean; 
    sentryDSN?: string;
  } = {}): void {
    if (this.isInitialized) {
      console.warn('ErrorTrackingService already initialized');
      return;
    }

    // Set up global error handlers
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Initialize Sentry if enabled and DSN is provided
    if (config.enableSentry && config.sentryDSN) {
      this.initializeSentry(config.sentryDSN);
      this.sentryEnabled = true;
    }

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
    
    this.isInitialized = true;
    console.log('ErrorTrackingService initialized');
  }

  private initializeSentry(dsn: string): void {
    // In a real implementation, you would initialize Sentry here
    console.log(`Sentry would be initialized with DSN: ${dsn}`);
  }

  private initializePerformanceMonitoring(): void {
    // Set up performance observers
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackPerformanceMetric({
              name: 'long-task',
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              context: { 
                startTime: entry.startTime,
                entryType: entry.entryType
              }
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Monitor navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          const navEntry = list.getEntries()[0];
          if (navEntry) {
            this.trackPerformanceMetric({
              name: 'page-load',
              value: navEntry.duration,
              unit: 'ms',
              timestamp: new Date(),
              context: { 
                navigationTiming: {
                  loadEventEnd: navEntry.loadEventEnd,
                  domComplete: navEntry.domComplete,
                  domInteractive: navEntry.domInteractive,
                  connectEnd: navEntry.connectEnd
                }
              }
            });
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.error('Error setting up PerformanceObserver', e);
      }
    }
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    this.captureError({
      message: event.message || 'Unknown error',
      severity: ErrorSeverity.ERROR,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      timestamp: new Date(),
      url: window.location.href,
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    let message = 'Promise rejection';
    if (event.reason instanceof Error) {
      message = event.reason.message;
    } else if (typeof event.reason === 'string') {
      message = event.reason;
    }

    this.captureError({
      message,
      severity: ErrorSeverity.ERROR,
      context: {
        type: 'unhandledrejection',
        reason: event.reason instanceof Error ? event.reason.stack : String(event.reason)
      },
      timestamp: new Date(),
      url: window.location.href,
    });
  };

  // Capture and process errors
  public captureError(errorData: Omit<ErrorData, 'timestamp'> & { timestamp?: Date }): void {
    const fullErrorData: ErrorData = {
      ...errorData,
      timestamp: errorData.timestamp || new Date(),
      url: errorData.url || window.location.href,
    };

    // Store error locally
    this.errors.push(fullErrorData);

    // Log to console for debugging
    this.logError(fullErrorData);

    // Send to Sentry if enabled
    if (this.sentryEnabled) {
      this.sendToSentry(fullErrorData);
    }

    // Check if this is a critical error for alerting
    if (fullErrorData.severity === ErrorSeverity.CRITICAL) {
      this.triggerAlerts(fullErrorData);
    }

    // Show UI toast for user-facing errors
    if (fullErrorData.severity === ErrorSeverity.ERROR || 
        fullErrorData.severity === ErrorSeverity.CRITICAL) {
      toast({
        title: fullErrorData.severity === ErrorSeverity.CRITICAL ? 
          "Critical Error" : "Application Error",
        description: fullErrorData.message,
        variant: "destructive",
      });
    }
  }

  // Register a callback for error alerts
  public onAlert(callback: (error: ErrorData) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Track performance metrics
  public trackPerformanceMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log metrics for debugging
    console.debug(`Performance Metric: ${metric.name} - ${metric.value}${metric.unit}`);
  }

  // Get all captured errors
  public getErrors(): ErrorData[] {
    return [...this.errors];
  }

  // Get all performance metrics
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear all errors and metrics (for testing)
  public clearAll(): void {
    this.errors = [];
    this.metrics = [];
  }

  // Send error to backend for persistent storage
  public async sendErrorsToBackend(): Promise<boolean> {
    if (this.errors.length === 0) return true;
    
    try {
      // In a real implementation, you would send to a backend API
      console.log(`Would send ${this.errors.length} errors to backend`);
      return true;
    } catch (error) {
      console.error('Failed to send errors to backend', error);
      return false;
    }
  }

  private logError(error: ErrorData): void {
    const logMethod = error.severity === ErrorSeverity.INFO 
      ? console.info 
      : error.severity === ErrorSeverity.WARNING 
        ? console.warn 
        : console.error;
    
    logMethod(`[${error.severity.toUpperCase()}] ${error.message}`, error);
  }

  private sendToSentry(error: ErrorData): void {
    // In a real implementation, you would send to Sentry here
    console.log(`Would send to Sentry: ${error.message}`);
  }

  private triggerAlerts(error: ErrorData): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in alert callback', err);
      }
    });
  }

  // Record user feedback about an error
  public recordUserFeedback(errorId: string, feedback: {
    comments: string;
    email?: string;
    name?: string;
    severity?: 'low' | 'medium' | 'high';
  }): void {
    console.log(`User feedback for error ${errorId}:`, feedback);
    // In a real implementation, you would store this feedback and associate with the error
  }
}

export default ErrorTrackingService;
