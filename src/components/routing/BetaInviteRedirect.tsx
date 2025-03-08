
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Redirects to beta program page with invite code when direct URL is accessed
 */
export function BetaInviteRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const inviteCode = searchParams.get('invite');
    
    if (inviteCode) {
      console.log(`BetaInviteRedirect: Redirecting to beta program with invite code ${inviteCode}`);
      sessionStorage.setItem('beta_invite_code', inviteCode);
      navigate(`/beta?invite=${inviteCode}`, { replace: true });
    } else {
      // If no invite code, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate, location.search]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
