
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { BetaSignupDialog } from '@/components/beta/BetaSignupDialog';
import { useAuth } from '@/components/AuthProvider';
import { betaTestingService } from '@/services/BetaTestingService';
import { adminService } from '@/services/admin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, GiftIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
  const location = useLocation();
  
  // First useEffect: Check for invite code in URL and handle session storage
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
        // This is important even if storedCode exists to ensure consistency
        sessionStorage.setItem('beta_invite_code', finalCode);
        
        // If we have an invite code but no session, show the signup dialog
        if (!session?.user?.id) {
          console.log('No user session, showing signup dialog');
          setShowSignupDialog(true);
        }
      }
      
      setIsLoading(false);
    };
    
    checkForInviteCode();
  }, [location.search, session?.user?.id]);
  
  // Second useEffect: Handle user authentication and beta status
  useEffect(() => {
    const checkBetaAccess = async () => {
      if (!session?.user?.id) return;
      
      try {
        console.log('Checking beta status for user:', session.user.id);
        // First check if the user is already a beta tester
        const isBeta = await adminService.checkUserRole('beta_tester');
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
              setIsBetaTester(true);
              
              // Check onboarding status after role is assigned
              const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
              setOnboardingComplete(status);
              
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
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user?.id) {
      checkBetaAccess();
    }
  }, [session, inviteCode, hasInviteCode, inviteProcessed, navigate]);
  
  // Handle dialog closing
  const handleDialogOpenChange = (open: boolean) => {
    setShowSignupDialog(open);
    
    // If dialog is closed manually without a session, redirect to auth page with the invite code
    if (!open && !session?.user?.id && hasInviteCode) {
      console.log('Dialog closed, redirecting to auth with invite code:', inviteCode);
      navigate(`/auth?view=sign_up&invite=${inviteCode}`);
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
      {/* Always show the dialog for users without a session who have an invite code */}
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
          <Card className="max-w-xl mx-auto shadow-lg border-blue-100">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center gap-2">
                <GiftIcon className="h-5 w-5 text-blue-500" />
                Beta Program Invitation
              </CardTitle>
              <CardDescription>
                You've been invited to join our exclusive beta program! Please sign in or create an account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                As a beta tester, you'll get:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-6">
                <li>Early access to new features</li>
                <li>Direct influence on product development</li>
                <li>Special recognition when we launch</li>
                <li>Priority support during the beta period</li>
              </ul>
              
              <p className="text-sm text-muted-foreground mb-4">
                Your invitation code: <span className="font-mono font-medium">{inviteCode}</span>
              </p>
            </CardContent>
            <CardFooter className="bg-gray-50/50 flex justify-center">
              <Button 
                onClick={() => setShowSignupDialog(true)}
                className="w-full md:w-auto"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign up or Log in to join the beta
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
