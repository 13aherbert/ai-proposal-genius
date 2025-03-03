
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BetaTesterDashboard } from '@/components/beta/BetaTesterDashboard';
import { BetaTesterOnboarding } from '@/components/beta/BetaTesterOnboarding';
import { useAuth } from '@/components/AuthProvider';
import { betaTestingService } from '@/services/BetaTestingService';
import { Button } from '@/components/ui/button';

export default function BetaProgram() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user?.id) {
        try {
          const status = await betaTestingService.checkBetaOnboardingStatus(session.user.id);
          setOnboardingComplete(status);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkOnboardingStatus();
  }, [session]);
  
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
  
  if (!onboardingComplete) {
    return <BetaTesterOnboarding />;
  }
  
  return <BetaTesterDashboard />;
}
