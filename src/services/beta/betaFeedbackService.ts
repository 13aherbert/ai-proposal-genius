
import { supabase } from "@/integrations/supabase/client";
import { BetaFeedbackData } from "../BetaTestingService";
import { mockFeedbackItems } from "../mocks/betaTestingMockData";

/**
 * Service for handling beta program feedback
 */
export class BetaFeedbackService {
  /**
   * Submit beta feedback to the database
   */
  async submitFeedback(feedbackData: Omit<BetaFeedbackData, 'status' | 'created_at' | 'updated_at'>): Promise<{data: any, error: any}> {
    // In a real implementation, this would save to a database table
    // For now, we'll mock the response
    const mockResponse = {
      data: { 
        ...feedbackData, 
        id: Math.random().toString(36).substring(2, 11), 
        status: 'open', 
        created_at: new Date().toISOString() 
      },
      error: null
    };
    
    console.log('Submitting beta feedback:', feedbackData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockResponse;
  }
  
  /**
   * Get beta feedback items for the current user
   */
  async getUserFeedback(userId: string): Promise<{data: BetaFeedbackData[], error: any}> {
    // In a real implementation, this would fetch from a database table
    // For now, we'll return mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { data: mockFeedbackItems(userId), error: null };
  }
}

export const betaFeedbackService = new BetaFeedbackService();
