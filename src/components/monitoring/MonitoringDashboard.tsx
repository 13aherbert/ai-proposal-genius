
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import { UserFeedbackDialog } from '@/components/feedback/UserFeedbackDialog';
import ErrorTrackingService, { ErrorData, ErrorSeverity, PerformanceMetric } from '@/services/ErrorTrackingService';

export function MonitoringDashboard() {
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorData | null>(null);
  const [activeTab, setActiveTab] = useState('errors');
  const errorService = ErrorTrackingService.getInstance();
  
  // Load errors and metrics
  const loadData = () => {
    setErrors(errorService.getErrors());
    setMetrics(errorService.getMetrics());
  };
  
  // Load data on initial render and when active tab changes
  useEffect(() => {
    loadData();
    
    // Set up an interval to refresh data
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // Clear all errors and metrics
  const handleClearAll = () => {
    errorService.clearAll();
    loadData();
  };
  
  // Open feedback dialog for a specific error
  const handleReportIssue = (error: ErrorData) => {
    setSelectedError(error);
    setFeedbackOpen(true);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };
  
  // Get severity class for styling
  const getSeverityClass = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'text-blue-500';
      case ErrorSeverity.WARNING:
        return 'text-amber-500';
      case ErrorSeverity.ERROR:
        return 'text-rose-500';
      case ErrorSeverity.CRITICAL:
        return 'text-red-700 font-bold';
      default:
        return '';
    }
  };
  
  // Get performance unit display
  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case 'ms':
        return 'ms';
      case 'bytes':
        return 'MB';
      case 'percent':
        return '%';
      case 'count':
        return '';
      default:
        return unit;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>System Monitoring</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              className="h-8"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button 
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="h-8"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Send Feedback
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor application errors and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="errors" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Errors {errors.length > 0 && `(${errors.length})`}
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="errors" className="space-y-4">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No errors recorded
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {errors.map((error, index) => (
                  <div 
                    key={index} 
                    className="border rounded-md p-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-medium ${getSeverityClass(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(error.timestamp)}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{error.message}</p>
                    {error.url && (
                      <p className="text-xs text-muted-foreground mb-1">
                        URL: {error.url}
                      </p>
                    )}
                    {error.context && (
                      <details className="text-xs mt-1">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Additional Details
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded-sm overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    {error.severity !== ErrorSeverity.INFO && (
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReportIssue(error)}
                          className="h-7 text-xs"
                        >
                          Report Issue
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            {metrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No performance metrics recorded
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {metrics.map((metric, index) => (
                  <div 
                    key={index} 
                    className="border rounded-md p-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{metric.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(metric.timestamp)}
                      </span>
                    </div>
                    <p className="font-medium mb-1">
                      Value: {metric.value.toFixed(2)} {getUnitDisplay(metric.unit)}
                    </p>
                    {metric.context && (
                      <details className="text-xs mt-1">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Additional Details
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded-sm overflow-x-auto">
                          {JSON.stringify(metric.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* User feedback dialog */}
      <UserFeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen}
        errorMessage={selectedError?.message}
        errorId={selectedError ? `error-${selectedError.timestamp.getTime()}` : undefined}
      />
    </Card>
  );
}
