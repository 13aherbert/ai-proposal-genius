import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emailService } from "@/services/EmailService";
import { useAuthStateManager } from "./AuthStateManager";
import { getAuthToken, setAuthToken, removeAuthToken, setUserRoles, clearAuthData } from "@/utils/network";

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
  console.log("AuthProvider rendering");
  
  try {
    console.log("AuthProvider: About to call useAuthStateManager");
    const [authState, authActions] = useAuthStateManager();
    console.log("AuthProvider: useAuthStateManager returned:", authState.status);
    
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AuthError | null>(null);
    const initTimeout = useRef<NodeJS.Timeout | null>(null);
    
    console.log("AuthProvider: About to call useNavigate");
    const navigate = useNavigate();
    console.log("AuthProvider: useNavigate returned");
    
    console.log("AuthProvider: About to call useLocation");
    const location = useLocation();
    console.log("AuthProvider: useLocation returned");

    const signOut = async () => {
      try {
        clearAuthData();
        
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

    console.log("AuthProvider: About to set up initialization effect");
    useEffect(() => {
      console.log("AuthProvider mounted, initializing auth state");
      
      initTimeout.current = setTimeout(() => {
        if (loading) {
          console.warn("Auth initialization timeout reached. Forcing completion.");
          setLoading(false);
        }
      }, 7000);
      
      authActions.initialize().finally(() => {
        setLoading(false);
      });
      
      return () => {
        if (initTimeout.current) {
          clearTimeout(initTimeout.current);
        }
      };
    }, []);
    
    console.log("AuthProvider: About to set up auth state effect");
    useEffect(() => {
      switch (authState.status) {
        case 'authenticated':
          setSession(authState.status === 'authenticated' ? authState.session : null);
          setError(null);
          setLoading(false);
          break;
        case 'unauthenticated':
          setSession(null);
          setError(null);
          setLoading(false);
          break;
        case 'error':
          setSession(null);
          setError(authState.error as AuthError);
          setLoading(false);
          break;
        case 'initializing':
          break;
      }
    }, [authState]);

    console.log("AuthProvider: About to set up auth state change effect");
    useEffect(() => {
      let isSubscribed = true;
      
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
        console.log('Auth state changed:', event);
        
        if (!isSubscribed) return;
        
        try {
          if (JSON.stringify(session) !== JSON.stringify(currentSession)) {
            setSession(currentSession);
            
            if (currentSession?.access_token) {
              setAuthToken(currentSession.access_token);
              
              try {
                const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles');
                if (!roleError && roleData) {
                  setUserRoles(roleData.roles);
                }
              } catch (roleErr) {
                console.error("Exception in background roles fetch:", roleErr);
              }
            } else if (event === 'SIGNED_OUT') {
              clearAuthData();
            }
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
                setAuthToken(currentSession.access_token);
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
      };
    }, [navigate, location.pathname, session]);

    console.log("AuthProvider: About to return context provider");
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
  } catch (error) {
    console.error("Error in AuthProvider component:", error);
    throw error;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
