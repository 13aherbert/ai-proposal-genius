import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emailService } from "@/services/EmailService";
import { SessionSecurity, SecureTokenStorage } from "@/utils/security/auth-security";
import { clearAuthData } from "@/utils/network";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true, 
  error: null,
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  deleteAccount: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const sessionFetchAttempted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const signOut = async () => {
    try {
      // Enhanced security cleanup
      SessionSecurity.invalidateSession();
      SecureTokenStorage.clearAllTokens();
      // SECURITY: Clear cached non-sensitive data only
      localStorage.removeItem('subscriptionData');
      localStorage.removeItem('userRoles');
      
      // Log security event
      try {
        await supabase.rpc('log_security_event', {
          event_type_param: 'user_logout',
          details_param: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
      
      // Sign out from Supabase with global scope
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Force page reload for complete cleanup
      window.location.href = '/';
    } catch (err: any) {
      console.error("Error signing out:", err);
      // Even if signout fails, clear local data and navigate
      SessionSecurity.invalidateSession();
      SecureTokenStorage.clearAllTokens();
      localStorage.removeItem('subscriptionData');
      localStorage.removeItem('userRoles');
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });
      if (error) throw error;
      
      await emailService.sendPasswordResetEmail(email, resetUrl);
      
      toast.success("Password reset email sent", {
        description: "Check your email for the reset link"
      });
      return { error: null };
    } catch (err: any) {
      console.error("Error resetting password:", err);
      toast.error("Failed to send reset email", {
        description: err.message || "Please try again"
      });
      return { error: err };
    }
  };

  const deleteAccount = async () => {
    try {
      if (!session?.user?.id) {
        toast.error("You must be logged in to delete your account");
        return;
      }

      toast.loading("Deleting your account...");

      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      if (!data?.success) {
        throw new Error('Failed to delete account');
      }

      toast.dismiss();
      clearAuthData();
      toast.success("Account successfully deleted");
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.dismiss();
      toast.error("Failed to delete account", {
        description: error.message || "Please try again or contact support"
      });
    }
  };

  const lastAccessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const timeoutId = setTimeout(() => {
      if (loading && !authInitialized) {
        console.warn("Auth initialization timeout reached. Force completing auth init.");
        if (isSubscribed) {
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    }, 4000);

    const fetchSession = async () => {
      if (sessionFetchAttempted.current) return;
      sessionFetchAttempted.current = true;
      
      try {
        console.log("Fetching session...");
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Session fetch timed out")), 3000);
        });
        
        const { data, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          if (isSubscribed) {
            setError(error);
          }
          console.error('Error getting session:', error);
          
          // SECURITY: Don't try to restore from localStorage tokens
          // Rely on Supabase's built-in session management with httpOnly cookies
          if (error.message === 'Session fetch timed out') {
            console.log('Session check timed out - user needs to re-authenticate');
          }
          
          if (error.message !== "Not authenticated") {
            toast.error("Authentication error", {
              description: "There was a problem connecting to the authentication service"
            });
          }
        } else {
          console.log("Session fetch complete:", data.session ? "Session found" : "No session");
          
          if (isSubscribed) {
            setSession(data.session);
            // SECURITY: Don't store access_token in localStorage
            // Supabase handles session persistence securely
          }
        }
      } catch (e) {
        console.error('Network error getting session:', e);
        toast.error("Network error", {
          description: "Could not connect to authentication service. Please check your internet connection."
        });
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      console.log('Auth state changed:', event);
      
      try {
        const newToken = currentSession?.access_token ?? null;
        if (isSubscribed && newToken !== lastAccessTokenRef.current) {
          lastAccessTokenRef.current = newToken;
          setSession(currentSession);

          if (event === 'SIGNED_OUT') {
            // SECURITY: Clear cached data on sign out
            localStorage.removeItem('subscriptionData');
            localStorage.removeItem('userRoles');
          }
          // Note: user roles are fetched by useUserRoles hook (single source of truth);
          // no background invocation here to avoid duplicate edge-function calls.
        }
        
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }

        switch (event) {
          case 'SIGNED_IN':
            // If the user picked a plan on the marketing pricing page before
            // signing up, kick off Stripe Checkout now that we have a session.
            if (currentSession?.user) {
              const raw = localStorage.getItem('selected_plan');
              if (raw) {
                localStorage.removeItem('selected_plan');
                try {
                  const plan = JSON.parse(raw);
                  const priceId = plan?.priceId;
                  if (priceId) {
                    const { createCheckoutSession } = await import(
                      '@/hooks/subscription/use-subscription-actions'
                    );
                    toast.loading('Starting your checkout…');
                    const { url, error } = await createCheckoutSession(priceId);
                    toast.dismiss();
                    if (url) {
                      window.location.href = url;
                      return;
                    }
                    if (error) console.error('selected_plan checkout failed:', error);
                  }
                } catch (e) {
                  console.warn('Invalid selected_plan payload:', e);
                }
              }
            }

            if (currentSession?.user && (location.pathname === '/' || location.pathname === '/auth')) {
              const createdAt = new Date(currentSession.user.created_at);
              const now = new Date();
              const isNewUser = (now.getTime() - createdAt.getTime()) < 10000;

              if (isNewUser) {
                console.log('New user detected, redirecting to dashboard');
                navigate("/dashboard", { replace: true });
                toast.success("Welcome! Let's get you started");
              } else {
                const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
                console.log(`Existing user detected, redirecting to ${redirectPath}`);
                navigate(redirectPath, { replace: true });
                toast.success("Successfully signed in");
                
                sessionStorage.removeItem('redirectAfterLogin');
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
            // SECURITY: Don't store access_token in localStorage
            // Supabase handles token refresh and storage securely
            break;
          case 'USER_UPDATED':
            toast.success("Profile updated");
            break;
          case 'PASSWORD_RECOVERY':
            navigate("/reset-password", { replace: true });
            toast.info("Please enter your new password");
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
        toast.error("Authentication error", {
          description: "There was a problem updating your authentication state"
        });
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    });

    const sessionTimeoutCheck = setInterval(() => {
      const expiresAt = lastAccessTokenRef.current ? null : null;
      // Read latest session via state setter pattern to avoid stale closure
      setSession(s => {
        if (s && new Date(s.expires_at * 1000) < new Date()) {
          toast.warning("Your session has expired", {
            description: "Please sign in again",
            duration: 5000,
          });
          signOut();
        }
        return s;
      });
    }, 60000);

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
      clearInterval(sessionTimeoutCheck);
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      error,
      signOut,
      resetPassword,
      deleteAccount
    }}>
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
