
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { useAuth } from '@/components/AuthProvider';
import { betaTestingService } from '@/services/BetaTestingService';
import { adminService } from '@/services/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { withRateLimit } from '@/utils/network/rate-limit';

export default function BetaProgram() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const { session } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('invite');
    if (code) {
      setInviteCode(code);
      setHasInviteCode(true);
    }
    
    const checkBetaAccess = async () => {
      // If we have an invite code but no session, redirect to auth page
      if (code && !session?.user?.id) {
        // Store invite code in session storage to retrieve after auth
        sessionStorage.setItem('beta_invite_code', code);
        // Redirect to auth page with signup view active
        navigate('/auth?view=sign_up&invite=' + code);
        return;
      }
      
      if (session?.user?.id) {
        try {
          // First check if the user is already a beta tester
          const isBeta = await adminService.checkUserRole('beta_tester');
          setIsBetaTester(isBeta);
          
          if (isBeta) {
            // If user is already a beta tester, check onboarding status
            const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
            setOnboardingComplete(status);
          } else if (code) {
            // If user has an invite code and is not a beta tester yet
            const invitation = await adminService.verifyBetaInvitation(code);
            
            if (invitation) {
              // If invitation is valid, accept it
              const success = await adminService.acceptBetaInvitation(code);
              
              if (success) {
                setIsBetaTester(true);
                
                // Check onboarding status after role is assigned
                const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
                setOnboardingComplete(status);
                
                // Send welcome email with rate limiting to prevent multiple sends
                if (session.user.email) {
                  try {
                    // Use the rate limiter to prevent duplicate emails
                    await withRateLimit(`beta-welcome:${session.user.email}`, async () => {
                      toast.success("Welcome to the beta program!");
                      
                      // Clean URL to remove invite code
                      navigate('/beta', { replace: true });
                    });
                  } catch (emailError) {
                    console.error("Rate limiting prevented sending welcome: ", emailError);
                    // Still navigate to beta page
                    navigate('/beta', { replace: true });
                  }
                }
              } else {
                toast.error("Error accepting beta invitation");
              }
            } else {
              toast.error("Invalid or expired invitation");
            }
          }
        } catch (error) {
          console.error('Error checking beta access:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkBetaAccess();
  }, [session, navigate, inviteCode]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading beta program...</p>
        </div>
      </div>
    );
  }
  
  if (!isBetaTester) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You don't have access to the beta program. Please contact the admin team for an invitation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!onboardingComplete) {
    return <BetaTesterOnboarding />;
  }
  
  return <BetaTesterDashboard />;
}
