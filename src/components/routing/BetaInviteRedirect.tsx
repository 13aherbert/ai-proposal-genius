
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * BetaInviteRedirect component
 * 
 * This component captures beta invite URLs and ensures they're properly
 * directed to the beta program page without authentication checks.
 */
export function BetaInviteRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const inviteCode = searchParams.get('invite');
    
    if (inviteCode) {
      console.log(`BetaInviteRedirect: Storing and redirecting with invite code ${inviteCode}`);
      
      // Store the invite code in session storage for retrieval in the beta page
      sessionStorage.setItem('beta_invite_code', inviteCode);
      
      // Redirect to the beta page with the invite code
      // Using replace to prevent back button issues
      navigate(`/beta?invite=${inviteCode}`, { replace: true });
    }
  }, [location.search, navigate]);
  
  return null;
}
