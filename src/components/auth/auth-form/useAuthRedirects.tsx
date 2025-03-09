
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthForm } from "./AuthFormContext";

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
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleRedirect(session);
      }
    };
    
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    };
  }, [navigate, location.search, setError]);
  
  const handleRedirect = (session: any) => {
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
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate("/dashboard");
      }
    }
  };
};
