
import React from 'react';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { BetaSignupDialog } from '@/components/beta/BetaSignupDialog';
import { BetaInvitationCard } from '@/components/beta/BetaInvitationCard';
import { BetaAccessDenied } from '@/components/beta/BetaAccessDenied';
import { BetaLoadingState } from '@/components/beta/BetaLoadingState';
import { useBetaProgram } from '@/hooks/useBetaProgram';

export default function BetaProgram() {
  const {
    isLoading,
    onboardingComplete,
    isBetaTester,
    hasInviteCode,
    inviteCode,
    showSignupDialog,
    session,
    handleDialogOpenChange,
    setShowSignupDialog
  } = useBetaProgram();
  
  if (isLoading) {
    return <BetaLoadingState />;
  }
  
  // Show the signup dialog immediately for users with invite codes but no session
  if (hasInviteCode && !session?.user?.id) {
    return (
      <>
        <BetaSignupDialog 
          open={true} 
          onOpenChange={handleDialogOpenChange} 
          inviteCode={inviteCode}
          autoOpen={true}
        />
        <div className="container mx-auto py-10">
          <BetaInvitationCard 
            inviteCode={inviteCode}
            onSignUpClick={() => setShowSignupDialog(true)}
          />
        </div>
      </>
    );
  }
  
  // For authenticated users without beta access and no invite code
  if (session?.user?.id && !isBetaTester && !hasInviteCode) {
    return <BetaAccessDenied />;
  }
  
  if (session?.user?.id && !onboardingComplete && isBetaTester) {
    return <BetaTesterOnboarding />;
  }
  
  // For authenticated beta testers
  if (session?.user?.id && isBetaTester) {
    return <BetaTesterDashboard />;
  }
  
  // Fallback for any other cases
  return (
    <div className="container mx-auto py-10">
      <BetaAccessDenied />
    </div>
  );
}
