
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import ErrorTrackingService, { ErrorSeverity } from "@/services/ErrorTrackingService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // Component name for better error tracking
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  private errorService = ErrorTrackingService.getInstance();
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: _, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error
    this.errorService.captureError({
      message: `Error in ${this.props.name || 'unknown component'}: ${error.message}`,
      severity: ErrorSeverity.ERROR,
      context: {
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        componentName: this.props.name
      },
      timestamp: new Date()
    });
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReportIssue = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;
    
    // Generate a unique ID for this error
    const errorId = Date.now().toString(36);
    
    // Show user feedback form
    this.errorService.recordUserFeedback(errorId, {
      comments: `Auto-reported from ErrorBoundary: ${error.message}`,
      severity: 'high'
    });
    
    alert("Thank you for reporting this issue. Our team has been notified.");
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-10 w-10 text-brand-green" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            An error occurred while rendering this part of the application.
          </p>
          {this.state.error && (
            <div className="mt-4 max-w-full overflow-auto rounded bg-muted p-2 text-left text-xs">
              <p className="font-mono text-destructive">{this.state.error.toString()}</p>
            </div>
          )}
          <div className="mt-6 flex space-x-2">
            <Button 
              onClick={this.handleReset}
              size="sm"
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button 
              onClick={this.handleReportIssue}
              size="sm"
              variant="outline"
              className="flex items-center"
            >
              Report issue
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
