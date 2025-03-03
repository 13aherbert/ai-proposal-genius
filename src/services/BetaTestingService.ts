
import { supabase } from "@/integrations/supabase/client";
import { adminService } from "./AdminService";

export type BetaFeedbackData = {
  id?: string;
  user_id: string;
  feedback_type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
  updated_at?: string;
  email?: string;
  name?: string;
  allow_contact?: boolean;
};

export type BetaMetrics = {
  activeBetaTesters: number;
  totalFeedbackItems: number;
  bugReports: number;
  featureRequests: number;
  improvementSuggestions: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  feedbackByWeek: Array<{
    weekStart: string;
    bugCount: number;
    featureCount: number;
    improvementCount: number;
  }>;
};

class BetaTestingService {
  /**
   * Submit beta feedback to the database
   */
  async submitFeedback(feedbackData: Omit<BetaFeedbackData, 'status' | 'created_at' | 'updated_at'>): Promise<{data: any, error: any}> {
    // In a real implementation, this would save to a database table
    // For now, we'll mock the response
    const mockResponse = {
      data: { ...feedbackData, id: Math.random().toString(36).substring(2, 11), status: 'open', created_at: new Date().toISOString() },
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
    const mockFeedbackItems: BetaFeedbackData[] = [
      {
        id: '1',
        user_id: userId,
        feedback_type: 'bug',
        title: 'Error when uploading large PDF files',
        description: 'When uploading PDF files larger than 10MB, the application crashes.',
        severity: 'high',
        status: 'in_progress',
        created_at: '2023-05-15T10:30:00Z'
      },
      {
        id: '2',
        user_id: userId,
        feedback_type: 'feature',
        title: 'Add dark mode support',
        description: 'Would be great to have a dark mode option for the application.',
        severity: 'medium',
        status: 'open',
        created_at: '2023-05-10T14:20:00Z'
      }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { data: mockFeedbackItems, error: null };
  }
  
  /**
   * Get beta testing metrics
   */
  async getBetaMetrics(): Promise<{data: BetaMetrics, error: any}> {
    // In a real implementation, this would calculate metrics from the database
    // For now, we'll return mock data
    const mockMetrics: BetaMetrics = {
      activeBetaTesters: 42,
      totalFeedbackItems: 124,
      bugReports: 29,
      featureRequests: 32,
      improvementSuggestions: 45,
      resolvedIssues: 18,
      averageResolutionTime: 2.3, // days
      feedbackByWeek: [
        {
          weekStart: '2023-05-01',
          bugCount: 12,
          featureCount: 5,
          improvementCount: 8
        },
        {
          weekStart: '2023-05-08',
          bugCount: 9,
          featureCount: 7,
          improvementCount: 10
        },
        {
          weekStart: '2023-05-15',
          bugCount: 5,
          featureCount: 9,
          improvementCount: 12
        },
        {
          weekStart: '2023-05-22',
          bugCount: 3,
          featureCount: 11,
          improvementCount: 15
        }
      ]
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return { data: mockMetrics, error: null };
  }
  
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
   * Get the list of beta testing tasks
   */
  async getBetaTestingTasks(): Promise<{
    active: Array<{id: string, title: string, description: string, priority: 'low' | 'medium' | 'high'}>,
    completed: Array<{id: string, title: string, description: string}>
  }> {
    // In a real implementation, this would fetch from a database
    // For now, we'll return mock data
    return {
      active: [
        {
          id: '1',
          title: "Test RFP Document Upload",
          description: "Try uploading different document formats and verify correct parsing",
          priority: "high"
        },
        {
          id: '2',
          title: "Create a Complex Proposal",
          description: "Test the proposal editor with multiple sections and formatting",
          priority: "medium"
        },
        {
          id: '3',
          title: "Verify Knowledge Base Integration",
          description: "Check that Knowledge Base entries are correctly suggested in proposal drafts",
          priority: "low"
        }
      ],
      completed: [
        {
          id: '4',
          title: "Initial Login Flow",
          description: "Test the login and registration process"
        }
      ]
    };
  }
}

export const betaTestingService = new BetaTestingService();
