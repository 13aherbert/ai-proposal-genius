import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthPersistence } from "@/hooks/auth/useAuthPersistence";

type BaseAuthContextType = {
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  deleteAccount: () => Promise<void>;
};

const BaseAuthContext = createContext<BaseAuthContextType>({ 
  session: null, 
  loading: true, 
  error: null,
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  deleteAccount: async () => {}
});

export const BaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const sessionFetchAttempted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    persistSession, 
    clearPersistedSession, 
    restoreSession, 
    isSessionExpired 
  } = useAuthPersistence();

  const signOut = async () => {
    try {
      clearPersistedSession();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast.success("Successfully signed out");
    } catch (err: any) {
      console.error("Error signing out:", err);
      toast.error("Failed to sign out", {
        description: err.message || "Please try again"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });
      if (error) throw error;
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
        console.warn("Auth initialization timeout reached");
        if (isSubscribed) {
          setAuthInitialized(true);
          setLoading(false);
        }
      }
    }, 7000);

    const initializeAuth = async () => {
      if (sessionFetchAttempted.current) return;
      sessionFetchAttempted.current = true;
      
      try {
        const restoredSession = await restoreSession();
        
        if (restoredSession) {
          if (isSubscribed) {
            setSession(restoredSession);
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }
        
        console.log("Fetching fresh session...");
        
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
          
          if (error.message !== "Not authenticated") {
            toast.error("Authentication error", {
              description: "There was a problem connecting to the authentication service"
            });
          }
        } else if (data?.session) {
          console.log("Session fetch complete - session found");
          
          if (isSubscribed) {
            setSession(data.session);
            persistSession(
              data.session.access_token,
              data.session.refresh_token,
              data.session.expires_at
            );
          }
        }
      } catch (e) {
        console.error('Network error getting session:', e);
        toast.error("Network error", {
          description: "Could not connect to authentication service"
        });
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      console.log('Auth state changed:', event);
      
      try {
        if (isSubscribed && JSON.stringify(session) !== JSON.stringify(currentSession)) {
          setSession(currentSession);
          
          if (currentSession?.access_token) {
            persistSession(
              currentSession.access_token,
              currentSession.refresh_token,
              currentSession.expires_at
            );
          } else if (event === 'SIGNED_OUT') {
            clearPersistedSession();
          }
        }
        
        if (isSubscribed) {
          setLoading(false);
          setAuthInitialized(true);
        }

        switch (event) {
          case 'SIGNED_IN':
            if (currentSession?.user) {
              const createdAt = new Date(currentSession.user.created_at);
              const now = new Date();
              const isNewUser = (now.getTime() - createdAt.getTime()) < 10000;

              if (isNewUser) {
                navigate("/subscription", { replace: true });
                toast.success("Welcome! Please choose your subscription plan");
              } else {
                const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
                navigate(redirectPath, { replace: true });
                toast.success("Successfully signed in");
                sessionStorage.removeItem('redirectAfterLogin');
              }
            }
            break;
            
          case 'SIGNED_OUT':
            clearPersistedSession();
            if (location.pathname !== '/') {
              toast.info("Signed out");
              navigate("/", { replace: true });
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            if (currentSession?.access_token) {
              persistSession(
                currentSession.access_token,
                currentSession.refresh_token,
                currentSession.expires_at
              );
            }
            break;
            
          case 'USER_UPDATED':
            toast.success("Profile updated");
            break;
            
          case 'PASSWORD_RECOVERY':
            navigate("/reset-password", { replace: true });
            toast.info("Please enter your new password");
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
      if (session && isSessionExpired()) {
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
  }, [navigate, location.pathname, session, persistSession, clearPersistedSession, restoreSession, isSessionExpired]);

  return (
    <BaseAuthContext.Provider value={{ 
      session, 
      loading, 
      error,
      signOut,
      resetPassword,
      deleteAccount
    }}>
      {children}
    </BaseAuthContext.Provider>
  );
};

export const useBaseAuth = () => {
  const context = useContext(BaseAuthContext);
  if (context === undefined) {
    throw new Error("useBaseAuth must be used within a BaseAuthProvider");
  }
  return context;
};
