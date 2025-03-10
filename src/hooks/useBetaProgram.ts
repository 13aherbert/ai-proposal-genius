
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { betaTestingService } from '@/services/BetaTestingService';
import { adminService } from '@/services/admin';
import { toast } from 'sonner';

export function useBetaProgram() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteProcessed, setInviteProcessed] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [roleCheckAttempts, setRoleCheckAttempts] = useState(0);
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for invite code in URL and handle session storage
  useEffect(() => {
    const checkForInviteCode = () => {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('invite');
      
      // Then check session storage (saved from previous redirect)
      const storedCode = sessionStorage.getItem('beta_invite_code');
      
      console.log('URL invite code:', code);
      console.log('Stored invite code:', storedCode);
      
      // Use URL code if available, fall back to stored code
      const finalCode = code || storedCode;
      
      if (finalCode) {
        console.log('Beta invite code detected:', finalCode);
        setInviteCode(finalCode);
        setHasInviteCode(true);
        
        // Store invite code in session storage to retrieve after auth
        sessionStorage.setItem('beta_invite_code', finalCode);
        
        // If we have an invite code but no session, show the signup dialog
        if (!session?.user?.id) {
          console.log('No user session with invite code, showing signup dialog');
          setShowSignupDialog(true);
        }
      }
      
      setIsLoading(false);
    };
    
    checkForInviteCode();
  }, [location.search, session?.user?.id]);
  
  // Handle user authentication and beta status
  useEffect(() => {
    const checkBetaAccess = async () => {
      if (!session?.user?.id) {
        return;
      }
      
      try {
        console.log('Checking beta status for user:', session.user.id);
        // First check if the user is already a beta tester
        const isBeta = await adminService.checkUserRole('beta_tester');
        console.log('Beta role check result:', isBeta);
        setIsBetaTester(isBeta);
        
        if (isBeta) {
          // If user is already a beta tester, check onboarding status
          const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
          setOnboardingComplete(status);
        } else if (hasInviteCode && !inviteProcessed) {
          // If user has an invite code and is not a beta tester yet
          setInviteProcessed(true); // Prevent multiple processing attempts
          
          console.log(`Verifying invite code: ${inviteCode}`);
          const invitation = await adminService.verifyBetaInvitation(inviteCode);
          
          if (invitation) {
            console.log(`Invitation is valid, accepting...`);
            const success = await adminService.acceptBetaInvitation(inviteCode);
            
            if (success) {
              console.log(`Invitation accepted successfully`);
              
              // Allow up to 3 attempts to check beta tester status with increasing delays
              // This helps account for potential role propagation delays
              let betaStatus = false;
              const checkBetaRole = async (attempt: number): Promise<boolean> => {
                console.log(`Checking beta status attempt ${attempt}`);
                const status = await adminService.checkUserRole('beta_tester');
                console.log(`Beta status check #${attempt}:`, status);
                return status;
              };
              
              betaStatus = await checkBetaRole(1);
              
              if (!betaStatus) {
                // Wait and retry
                setTimeout(async () => {
                  betaStatus = await checkBetaRole(2);
                  setIsBetaTester(betaStatus);
                  
                  if (!betaStatus) {
                    // Final attempt with longer delay
                    setTimeout(async () => {
                      betaStatus = await checkBetaRole(3);
                      setIsBetaTester(betaStatus);
                      
                      if (betaStatus) {
                        // If successful on retry, check onboarding status
                        const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
                        setOnboardingComplete(status);
                      } else {
                        console.error('Failed to verify beta role after multiple attempts');
                        // Force a page refresh as last resort
                        window.location.reload();
                      }
                    }, 2000);
                  } else {
                    // Check onboarding status if role check succeeds
                    const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
                    setOnboardingComplete(status);
                  }
                }, 1000);
              } else {
                setIsBetaTester(true);
                const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
                setOnboardingComplete(status);
              }
              
              // Send welcome notification
              toast.success("Welcome to the beta program!");
              
              // Clean URL to remove invite code
              navigate('/beta', { replace: true });
              
              // Clear the stored invite code after successful processing
              sessionStorage.removeItem('beta_invite_code');
            } else {
              console.error(`Failed to accept invitation`);
              toast.error("Error accepting beta invitation");
            }
          } else {
            console.error(`Invalid or expired invitation`);
            toast.error("Invalid or expired invitation");
          }
        }
      } catch (error) {
        console.error('Error checking beta access:', error);
      }
    };
    
    if (session?.user?.id) {
      checkBetaAccess();
    }
  }, [session, inviteCode, hasInviteCode, inviteProcessed, navigate, roleCheckAttempts]);

  const handleDialogOpenChange = (open: boolean) => {
    setShowSignupDialog(open);
    
    // If dialog is closed manually and user is not authenticated, 
    // store the invite code for later
    if (!open && !session?.user?.id && inviteCode) {
      console.log('Dialog closed but invite code preserved for later use');
      sessionStorage.setItem('beta_invite_code', inviteCode);
    }
  };

  return {
    isLoading,
    onboardingComplete,
    isBetaTester,
    hasInviteCode,
    inviteCode,
    showSignupDialog,
    session,
    handleDialogOpenChange,
    setShowSignupDialog
  };
}
