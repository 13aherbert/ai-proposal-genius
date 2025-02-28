
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        toast.error("Error initializing session");
      }
      setSession(initialSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      console.log('Auth state changed:', event);
      
      // Only update session if it's actually different
      if (JSON.stringify(session) !== JSON.stringify(currentSession)) {
        setSession(currentSession);
      }
      setLoading(false);

      // Handle specific auth events that require navigation
      switch (event) {
        case 'SIGNED_IN':
          if (currentSession?.user && location.pathname === '/') {
            // Check if this is a new signup
            const createdAt = new Date(currentSession.user.created_at);
            const now = new Date();
            const isNewUser = (now.getTime() - createdAt.getTime()) < 10000; // Within 10 seconds

            if (isNewUser) {
              console.log('New user detected, redirecting to subscription page');
              navigate("/subscription", { replace: true });
              toast.success("Welcome! Please choose your subscription plan");
            } else {
              console.log('Existing user detected, redirecting to dashboard');
              navigate("/dashboard", { replace: true });
              toast.success("Successfully signed in");
            }
          }
          break;
        case 'SIGNED_OUT':
          if (location.pathname !== '/') {
            toast.info("Signed out");
            navigate("/", { replace: true });
          }
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully');
          break;
        case 'USER_UPDATED':
          toast.success("Profile updated");
          break;
        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Added location.pathname to dependencies

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
