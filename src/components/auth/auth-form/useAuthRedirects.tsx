
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthForm } from "./AuthFormContext";
import { toast } from "sonner";

export const useAuthRedirects = () => {
  const { setIsSignUp, setError } = useAuthForm();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for invite parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    const inviteParam = searchParams.get('invite');
    
    if (viewParam === 'sign_up') {
      setIsSignUp(true);
    }
    
    // If we have an invite in session storage, get it
    const storedInvite = sessionStorage.getItem('beta_invite_code');
    if (storedInvite || inviteParam) {
      // We're coming from an invite link, ensure we're in signup mode
      setIsSignUp(true);
      
      // Store the invite code in session storage if it came from URL
      if (inviteParam && !storedInvite) {
        console.log('Storing invite code in session storage:', inviteParam);
        sessionStorage.setItem('beta_invite_code', inviteParam);
      }
    }
  }, [location, setIsSignUp]);

  useEffect(() => {
    // Set a timeout to detect potential auth state hang
    const timeoutId = setTimeout(() => {
      console.log("Auth redirect timeout reached - no state change detected");
    }, 10000);
    
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session in redirects:", error);
          return;
        }
        
        if (session) {
          console.log("Session found in redirects check, handling redirect");
          handleRedirect(session);
        } else {
          console.log("No session found in redirects check");
        }
      } catch (e) {
        console.error("Exception checking session in redirects:", e);
      }
    };
    
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in redirects:", event);
      
      if (event === "SIGNED_IN" && session) {
        handleRedirect(session);
        setError("");
      }
      if (event === "SIGNED_OUT") {
        // If there's a beta invite code, redirect to the beta page
        const storedInvite = sessionStorage.getItem('beta_invite_code');
        if (storedInvite) {
          navigate(`/beta?invite=${storedInvite}`);
        } else {
          navigate("/");
        }
      }
      if (event === "PASSWORD_RECOVERY") {
        setError("");
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate, location.search, setError]);
  
  const handleRedirect = (session: any) => {
    // Ensure we have the token in localStorage
    if (session?.access_token) {
      localStorage.setItem('userToken', session.access_token);
      
      // Prefetch user roles for faster access later
      supabase.functions.invoke('get-user-roles')
        .then(({ data, error }) => {
          if (!error && data?.roles) {
            localStorage.setItem('userRoles', JSON.stringify(data.roles));
          }
        })
        .catch(err => console.error("Failed to prefetch user roles:", err));
    }
    
    // Check for invite code in session storage first, then URL
    const storedInvite = sessionStorage.getItem('beta_invite_code');
    const searchParams = new URLSearchParams(location.search);
    const inviteParam = searchParams.get('invite');
    
    if (storedInvite || inviteParam) {
      const inviteCode = storedInvite || inviteParam;
      console.log('Redirecting to beta program with invite code:', inviteCode);
      
      // Redirect to beta page with invite code
      navigate(`/beta?invite=${inviteCode}`);
    } else {
      // Check if we have a redirect path stored
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log("Redirecting to stored path:", redirectPath);
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
        toast.success("Successfully logged in");
      } else {
        console.log("Redirecting to dashboard (default)");
        navigate("/dashboard");
        toast.success("Successfully logged in");
      }
    }
  };
};
