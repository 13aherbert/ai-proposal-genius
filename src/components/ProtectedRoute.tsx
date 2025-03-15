
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionNotifications } from "@/hooks/use-subscription-notifications";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * ProtectedRoute component
 * 
 * A wrapper component that provides authentication protection for routes.
 * It handles:
 * - Redirecting unauthenticated users to the login page
 * - Displaying loading state while checking authentication
 * - Handling authentication errors
 * - Saving the attempted route for redirect after login
 * - Providing detailed error feedback
 * - Supporting grace period for expired subscriptions
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, error } = useAuth();
  const { isInGracePeriod, hasFailedPayment } = useSubscriptionNotifications();
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const cachedTokenRef = useRef<string | null>(localStorage.getItem('userToken'));
  const hasVerifiedCachedToken = useRef<boolean>(false);

  // Add a progressive timeout to show more information as time passes
  useEffect(() => {
    if (!loading) return;
    
    const stepInterval = setInterval(() => {
      setLoadingElapsed(prev => {
        const newValue = prev + 1;
        
        // Show timeout message earlier at 3 seconds
        if (newValue === 3 && loading) {
          setTimeoutOccurred(true);
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, [loading]);

  // Check cached token validity and use it for early access
  useEffect(() => {
    if (loading && cachedTokenRef.current && !hasVerifiedCachedToken.current && loadingElapsed >= 2) {
      console.log("Verifying cached token for early access while full auth completes");
      hasVerifiedCachedToken.current = true;
      
      // Don't redirect away from subscription page when using cached token
      if (location.pathname === '/' || location.pathname.includes('/subscription')) {
        return; // These pages have special handling
      }
      
      // If we have cached roles and subscription data along with a token, we can proceed
      const hasRoles = localStorage.getItem('userRoles');
      const hasSubscription = localStorage.getItem('subscriptionData');
      
      if (hasRoles && hasSubscription) {
        console.log("Using cached token and data for authentication while waiting for server");
        
        // We can continue using cached data until full auth completes
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
        if (location.pathname !== redirectPath) {
          navigate(redirectPath, { replace: true });
        }
      }
    }
  }, [loading, loadingElapsed, session, navigate, location.pathname]);

  // Reset loading elapsed when loading state changes
  useEffect(() => {
    if (!loading) {
      setLoadingElapsed(0);
      setTimeoutOccurred(false);
    }
  }, [loading]);

  // Attempt early navigation if we have a cached token
  useEffect(() => {
    if (loading && cachedTokenRef.current && loadingElapsed >= 2 && !session) {
      console.log("Using cached token for early access while full auth completes");
      // Don't redirect away from subscription page when using cached token
      if (location.pathname !== '/' && !location.pathname.includes('/subscription')) {
        return; // Already on a valid page
      }
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [loading, loadingElapsed, session, navigate, location.pathname]);

  useEffect(() => {
    // If we're done loading and there's no session, redirect to login
    if (!loading && !session) {
      console.log("No authenticated session, redirecting to login");
      
      // Save the attempted route for redirecting back after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      
      toast.info("Authentication required", {
        description: "Please log in to access this page",
        duration: 5000,
      });
      
      navigate("/");
    }
    
    // Handle auth errors
    if (error) {
      console.error("Auth error in protected route:", error);
      
      // Handle different types of auth errors specifically
      if (error.message.includes('expired')) {
        toast.warning("Your session has expired", {
          description: "Please log in again",
          duration: 5000,
        });
      } else if (error.message.includes('network')) {
        toast.error("Network error", {
          description: "Please check your internet connection",
          duration: 5000,
        });
      } else if (error.message.includes('not found')) {
        toast.error("User not found", {
          description: "Please check your credentials",
          duration: 5000,
        });
      } else {
        toast.error("Authentication error", {
          description: error.message || "Please try logging in again",
          duration: 5000,
        });
      }
    }
  }, [session, loading, error, navigate, location]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
        <p className="text-muted-foreground">Loading your session... {loadingElapsed > 2 ? `(${loadingElapsed}s)` : ''}</p>
        
        {timeoutOccurred && (
          <div className="mt-4 text-center max-w-md">
            <p className="text-muted-foreground text-sm mb-2">
              This is taking longer than expected. You can try:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brand-green text-white rounded-md text-sm hover:bg-brand-green/90 flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh the page
              </button>
              <button
                onClick={() => {
                  // Clear auth data and reload
                  localStorage.removeItem('userToken');
                  localStorage.removeItem('userRoles');
                  localStorage.removeItem('subscriptionData');
                  sessionStorage.removeItem('redirectAfterLogin');
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-destructive/60 text-white rounded-md text-sm hover:bg-destructive/80 flex items-center justify-center"
              >
                Sign out and try again
              </button>
            </div>
            {loadingElapsed > 5 && cachedTokenRef.current && (
              <p className="text-muted-foreground text-sm mt-4">
                Using cached authentication data while waiting for server response. Limited functionality may be available.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show error state if there's an auth error
  if (error && !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green/90"
            >
              Return to Login
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userRoles');
                window.location.reload();
              }}
              className="px-4 py-2 bg-secondary text-primary rounded-md hover:bg-secondary/80"
            >
              Clear Cache & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only show banners if not on the subscription page itself
  const isSubscriptionPage = location.pathname === '/subscription';
  
  // Show warning for failed payments, but still allow access
  if (hasFailedPayment() && session && !isSubscriptionPage && 
      subscription?.plan_type !== 'pro') {
    return (
      <div className="relative">
        <div className="sticky top-0 w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center z-50">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p className="text-sm font-medium">
            We couldn't process your payment. Please update your payment method to avoid service interruption.
            <button 
              onClick={() => navigate('/subscription')} 
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
  if (isInGracePeriod() && session && !isSubscriptionPage && 
      subscription?.plan_type !== 'pro') {
    return (
      <div className="relative">
        <div className="sticky top-0 w-full bg-amber-500 text-white py-2 px-4 flex items-center justify-center z-50">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p className="text-sm font-medium">
            Your subscription has expired but is in the grace period. Renew now to avoid losing access.
            <button 
              onClick={() => navigate('/subscription')} 
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

  // Add a security check - don't render anything if no session
  return (session || cachedTokenRef.current) ? <>{children}</> : null;
};

export { ProtectedRoute };
