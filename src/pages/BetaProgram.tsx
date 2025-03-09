
import React from 'react';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { BetaSignupDialog } from '@/components/beta/BetaSignupDialog';
import { BetaInvitationCard } from '@/components/beta/BetaInvitationCard';
import { BetaAccessDenied } from '@/components/beta/BetaAccessDenied';
import { BetaLoadingState } from '@/components/beta/BetaLoadingState';
import { useBetaProgram } from '@/hooks/useBetaProgram';

// This is an unprotected component - authentication is checked within the component
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
  
  // For authenticated users without beta access and no invite code
  if (session?.user?.id && !isBetaTester && !hasInviteCode) {
    return <BetaAccessDenied />;
  }
  
  if (session?.user?.id && !onboardingComplete && isBetaTester) {
    return <BetaTesterOnboarding />;
  }
  
  // For users with invite code but no session, or authenticated beta testers
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
      
      {session?.user?.id && isBetaTester ? (
        <BetaTesterDashboard />
      ) : hasInviteCode && !session?.user?.id ? (
        <div className="container mx-auto py-10">
          <BetaInvitationCard 
            inviteCode={inviteCode}
            onSignUpClick={() => setShowSignupDialog(true)}
          />
        </div>
      ) : null}
    </>
  );
}
