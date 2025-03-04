
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

export default function BetaProgram() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const { session } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's an invite code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('invite');
    if (code) {
      setInviteCode(code);
      setHasInviteCode(true);
    }
    
    const checkBetaAccess = async () => {
      if (session?.user?.id) {
        try {
          // First check if the user is a beta tester in the database
          const isBeta = await adminService.checkUserRole('beta_tester');
          setIsBetaTester(isBeta);
          
          if (isBeta) {
            // If they're a beta tester, check if they've completed onboarding
            const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
            setOnboardingComplete(status);
          } else if (code) {
            // If they're not a beta tester but have an invite code, verify it
            const invitation = await adminService.verifyBetaInvitation(code);
            if (invitation) {
              // Valid invitation
              setIsBetaTester(true);
              
              // Accept the invitation automatically
              await adminService.acceptBetaInvitation(code);
              
              // Check onboarding status after accepting invitation
              const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
              setOnboardingComplete(status);
              
              // Remove the invite code from the URL
              navigate('/beta', { replace: true });
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
