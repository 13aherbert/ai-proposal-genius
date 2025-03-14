
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/auth/AuthUserContext";

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export const AuthGuard = ({ 
  children, 
  requiredRoles = [], 
  redirectTo = "/"
}: AuthGuardProps) => {
  const { 
    isAuthenticated, 
    isLoadingAuth, 
    isLoadingStatus,
    hasRole,
    isInGracePeriod,
    hasFailedPayment,
    subscription,
    refreshUserStatus
  } = useAuthUser();
  
  const location = useLocation();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Add a progressive timeout to show more information as time passes
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingStatus) return;
    
    const stepInterval = setInterval(() => {
      setLoadingElapsed(prev => {
        const newValue = prev + 1;
        
        // Show timeout message at 3 seconds
        if (newValue === 3 && (isLoadingAuth || isLoadingStatus)) {
          setTimeoutOccurred(true);
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, [isLoadingAuth, isLoadingStatus]);

  // Reset loading time when loading state changes
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingStatus) {
      setLoadingElapsed(0);
      setTimeoutOccurred(false);
    }
  }, [isLoadingAuth, isLoadingStatus]);

  // Check authorization when roles and auth state are available
  useEffect(() => {
    // Don't check until we're done loading
    if (isLoadingAuth || isLoadingStatus) {
      return;
    }
    
    // Not authenticated at all
    if (!isAuthenticated) {
      setIsAuthorized(false);
      return;
    }
    
    // No specific roles required, just authentication
    if (requiredRoles.length === 0) {
      setIsAuthorized(true);
      return;
    }
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    setIsAuthorized(hasRequiredRole);
    
    if (!hasRequiredRole) {
      toast.error("Access denied", {
        description: "You don't have permission to access this page"
      });
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingStatus, hasRole, requiredRoles]);

  // Save the current location for redirecting back after login
  useEffect(() => {
    if (!isAuthenticated && !isLoadingAuth) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isAuthenticated, isLoadingAuth, location.pathname]);

  // Show loading state
  if (isLoadingAuth || isLoadingStatus || isAuthorized === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
        <p className="text-muted-foreground">
          {isLoadingAuth ? "Verifying your session" : "Loading your account"}
          {loadingElapsed > 2 ? ` (${loadingElapsed}s)` : ''}
        </p>
        
        {timeoutOccurred && (
          <div className="mt-4 text-center max-w-md">
            <p className="text-muted-foreground text-sm mb-2">
              This is taking longer than expected. You can try:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button 
                onClick={() => refreshUserStatus(true)}
                className="px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90 flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-primary rounded-md text-sm hover:bg-secondary/80 flex items-center justify-center"
              >
                Reload page
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthorized) {
    toast.warning("Authentication required", {
      description: "Please log in to access this page"
    });
    return <Navigate to={redirectTo} replace />;
  }

  // Show warning for failed payments, but still allow access
  const isSubscriptionPage = location.pathname === '/subscription';
  if (hasFailedPayment() && !isSubscriptionPage && subscription?.plan_type !== 'pro') {
    return (
      <div className="relative">
        <div className="sticky top-0 w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center z-50">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p className="text-sm font-medium">
            We couldn't process your payment. Please update your payment method to avoid service interruption.
            <button 
              onClick={() => window.location.href = '/subscription'} 
              className="ml-2 underline"
            >
              Update now
            </button>
          </p>
        </div>
        {children}
      </div>
    );
  }

  // Show grace period banner but still allow access
  if (isInGracePeriod() && !isSubscriptionPage && subscription?.plan_type !== 'pro') {
    return (
      <div className="relative">
        <div className="sticky top-0 w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center z-50">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p className="text-sm font-medium">
            Your subscription has expired but is in the grace period. Renew now to avoid losing access.
            <button 
              onClick={() => window.location.href = '/subscription'} 
              className="ml-2 underline"
            >
              Renew now
            </button>
          </p>
        </div>
        {children}
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};
