
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        description: "Please log in to access this page"
      });
      
      navigate("/");
    }
    
    // Handle auth errors
    if (error) {
      console.error("Auth error in protected route:", error);
      
      // If there's a specific auth error that we want to handle differently
      if (error.message.includes('expired')) {
        toast.warning("Your session has expired", {
          description: "Please log in again"
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

  return session ? <>{children}</> : null;
};

export { ProtectedRoute };
