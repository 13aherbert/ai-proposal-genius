
import { supabase } from "@/integrations/supabase/client";
import { adminService } from "../admin";

/**
 * Service for handling beta program onboarding
 */
export class BetaOnboardingService {
  /**
   * Check if the user has completed beta onboarding
   */
  async checkBetaOnboardingStatus(userId: string): Promise<boolean> {
    // First check if the user is actually a beta tester
    const isBetaTester = await adminService.checkUserRole('beta_tester');
    if (!isBetaTester) {
      return false;
    }
    
    // For now, we'll use localStorage for demo purposes
    return localStorage.getItem('betaOnboardingComplete') === 'true';
  }
  
  /**
   * Mark beta onboarding as complete
   */
  async completeBetaOnboarding(userId: string): Promise<boolean> {
    // For now, we'll use localStorage for demo purposes
    localStorage.setItem('betaOnboardingComplete', 'true');
    return true;
  }
}

export const betaOnboardingService = new BetaOnboardingService();
