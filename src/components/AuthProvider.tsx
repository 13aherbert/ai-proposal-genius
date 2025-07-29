import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emailService } from "@/services/EmailService";
import { SessionSecurity, SecureTokenStorage } from "@/utils/security/auth-security";

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
      localStorage.removeItem('userToken');
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
      localStorage.clear();
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

      const userId = session.user.id;
      
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);
        
      if (subscriptionError) {
        throw new Error(`Failed to remove subscription data: ${subscriptionError.message}`);
      }
      
      const { error: documentsError } = await supabase
        .from('project_documents')
        .delete()
        .eq('user_id', userId);
        
      if (documentsError) {
        throw new Error(`Failed to remove document data: ${documentsError.message}`);
      }
      
      const { error: sectionsError } = await supabase
        .from('proposal_sections')
        .delete()
        .eq('user_id', userId);
        
      if (sectionsError) {
        throw new Error(`Failed to remove proposal sections: ${sectionsError.message}`);
      }
      
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', userId);
        
      if (projectsError) {
        throw new Error(`Failed to remove projects: ${projectsError.message}`);
      }
      
      const { error: entriesError } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('user_id', userId);
        
      if (entriesError) {
        throw new Error(`Failed to remove knowledge entries: ${entriesError.message}`);
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('profile_id', userId);
        
      if (profileError) {
        throw new Error(`Failed to remove profile: ${profileError.message}`);
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(
        userId
      );

      if (authError) {
        throw new Error(`Failed to delete user: ${authError.message}`);
      }

      toast.dismiss();
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
    }, 7000);

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
          
          if (error.message === 'Session fetch timed out') {
            console.log('Session check timed out, but token found in localStorage');
            
            // If session fetch times out, try using the stored token
            const storedToken = localStorage.getItem('userToken');
            if (storedToken) {
              try {
                // Try to set session with stored token
                const { data: tokenData, error: tokenError } = await supabase.auth.setSession({
                  access_token: storedToken,
                  refresh_token: ''
                });
                
                if (!tokenError && tokenData?.session) {
                  if (isSubscribed) {
                    setSession(tokenData.session);
                  }
                  console.log("Session restored from localStorage token");
                }
              } catch (e) {
                console.error("Failed to restore session from token:", e);
              }
            }
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
            
            if (data.session?.access_token) {
              localStorage.setItem('userToken', data.session.access_token);
            }
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
        if (isSubscribed && JSON.stringify(session) !== JSON.stringify(currentSession)) {
          setSession(currentSession);
          
          if (currentSession?.access_token) {
            localStorage.setItem('userToken', currentSession.access_token);
            
            try {
              // Fetch user roles in the background for faster access
              Promise.race([
                supabase.functions.invoke('get-user-roles', {
                  headers: {
                    Authorization: `Bearer ${currentSession.access_token}`
                  }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Roles fetch timeout")), 3000))
              ]).then(({ data: roleData, error: roleError }: any) => {
                if (!roleError && roleData) {
                  localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
                }
              }).catch(err => {
                console.error("Failed to fetch user roles (non-blocking):", err);
                
                // Try the fallback method with token in body
                supabase.functions.invoke('get-user-roles', {
                  body: { token: currentSession.access_token }
                }).then(({ data: roleData, error: roleError }: any) => {
                  if (!roleError && roleData) {
                    localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
                  }
                }).catch(err2 => {
                  console.error("Fallback roles fetch also failed:", err2);
                });
              });
            } catch (roleErr) {
              console.error("Exception in background roles fetch:", roleErr);
            }
          } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('subscriptionData');
            localStorage.removeItem('userRoles');
          }
        }
        
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }

        switch (event) {
          case 'SIGNED_IN':
            if (currentSession?.user && location.pathname === '/') {
              const createdAt = new Date(currentSession.user.created_at);
              const now = new Date();
              const isNewUser = (now.getTime() - createdAt.getTime()) < 10000;

              if (isNewUser) {
                console.log('New user detected, redirecting to subscription page');
                navigate("/subscription", { replace: true });
                toast.success("Welcome! Please choose your subscription plan");
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
            if (currentSession?.access_token) {
              localStorage.setItem('userToken', currentSession.access_token);
            }
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
      if (session && new Date(session.expires_at * 1000) < new Date()) {
        toast.warning("Your session has expired", {
          description: "Please sign in again",
          duration: 5000,
        });
        signOut();
      }
    }, 60000);

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
      clearInterval(sessionTimeoutCheck);
      clearTimeout(timeoutId);
    };
  }, [navigate, location.pathname, session]);

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
