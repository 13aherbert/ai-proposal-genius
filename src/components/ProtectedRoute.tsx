
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        <p className="text-muted-foreground">Loading your session...</p>
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
          <button 
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Add a security check - don't render anything if no session
  return session ? <>{children}</> : null;
};

export { ProtectedRoute };
