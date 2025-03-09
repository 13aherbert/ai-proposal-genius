
import { supabase } from "@/integrations/supabase/client";
import { BetaMetrics } from "../BetaTestingService";
import { mockBetaMetrics } from "../mocks/betaTestingMockData";

/**
 * Service for handling beta program metrics
 */
export class BetaMetricsService {
  /**
   * Get beta testing metrics
   */
  async getBetaMetrics(): Promise<{data: BetaMetrics, error: any}> {
    // In a real implementation, this would calculate metrics from the database
    // For now, we'll return mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return { data: mockBetaMetrics, error: null };
  }
}

export const betaMetricsService = new BetaMetricsService();
