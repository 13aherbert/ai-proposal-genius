
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { BetaSignupDialog } from '@/components/beta/BetaSignupDialog';
import { useAuth } from '@/components/AuthProvider';
import { betaTestingService } from '@/services/BetaTestingService';
import { adminService } from '@/services/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BetaProgram() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteProcessed, setInviteProcessed] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('invite');
    if (code) {
      setInviteCode(code);
      setHasInviteCode(true);
      
      // If we have an invite code but no session, show the signup dialog
      if (!session?.user?.id) {
        setShowSignupDialog(true);
        setIsLoading(false);
      }
    }
    
    const checkBetaAccess = async () => {
      // If we have an invite code but no session, show the signup dialog
      if (code && !session?.user?.id) {
        // Store invite code in session storage to retrieve after auth
        sessionStorage.setItem('beta_invite_code', code);
        setShowSignupDialog(true);
        setIsLoading(false);
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
          } else if (code && !inviteProcessed) {
            // If user has an invite code and is not a beta tester yet
            setInviteProcessed(true); // Prevent multiple processing attempts
            
            console.log(`Verifying invite code: ${code}`);
            const invitation = await adminService.verifyBetaInvitation(code);
            
            if (invitation) {
              console.log(`Invitation is valid, accepting...`);
              const success = await adminService.acceptBetaInvitation(code);
              
              if (success) {
                console.log(`Invitation accepted successfully`);
                setIsBetaTester(true);
                
                // Check onboarding status after role is assigned
                const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
                setOnboardingComplete(status);
                
                // Send welcome notification
                toast.success("Welcome to the beta program!");
                
                // Clean URL to remove invite code
                navigate('/beta', { replace: true });
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
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkBetaAccess();
  }, [session, navigate, inviteCode, inviteProcessed]);
  
  // Handle dialog closing
  const handleDialogOpenChange = (open: boolean) => {
    setShowSignupDialog(open);
    
    // If dialog is closed and still no session, redirect to auth page
    if (!open && !session?.user?.id && hasInviteCode) {
      navigate('/auth?view=sign_up&invite=' + inviteCode);
    }
  };
  
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
  
  if (!isBetaTester && !hasInviteCode) {
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
  
  if (!onboardingComplete && isBetaTester) {
    return <BetaTesterOnboarding />;
  }
  
  return (
    <>
      {hasInviteCode && !session?.user?.id && (
        <BetaSignupDialog 
          open={showSignupDialog} 
          onOpenChange={handleDialogOpenChange} 
          inviteCode={inviteCode}
        />
      )}
      
      {isBetaTester ? (
        <BetaTesterDashboard />
      ) : (
        <div className="container mx-auto py-10">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Beta Invitation
              </CardTitle>
              <CardDescription>
                You've been invited to join our beta program! {session?.user?.id ? 
                  "We're processing your invitation." : 
                  "Please sign in or create an account to continue."}
              </CardDescription>
            </CardHeader>
            {!session?.user?.id && (
              <CardContent>
                <Button 
                  onClick={() => setShowSignupDialog(true)}
                  className="w-full"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign up or Log in to continue
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
