
import { betaFeedbackService } from "./beta/betaFeedbackService";
import { betaMetricsService } from "./beta/betaMetricsService";
import { betaTasksService } from "./beta/betaTasksService";
import { betaOnboardingService } from "./beta/betaOnboardingService";

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

/**
 * Consolidated service for beta testing features
 * Delegates to specialized services for different functionality
 */
class BetaTestingService {
  // Feedback methods
  async submitFeedback(feedbackData: Omit<BetaFeedbackData, 'status' | 'created_at' | 'updated_at'>) {
    return betaFeedbackService.submitFeedback(feedbackData);
  }
  
  async getUserFeedback(userId: string) {
    return betaFeedbackService.getUserFeedback(userId);
  }
  
  // Metrics methods
  async getBetaMetrics() {
    return betaMetricsService.getBetaMetrics();
  }
  
  // Onboarding methods
  async checkBetaOnboardingStatus(userId: string) {
    return betaOnboardingService.checkBetaOnboardingStatus(userId);
  }
  
  async completeBetaOnboarding(userId: string) {
    return betaOnboardingService.completeBetaOnboarding(userId);
  }
  
  // Task methods
  async getBetaTestingTasks() {
    return betaTasksService.getBetaTestingTasks();
  }
  
  async completeTask(taskId: string, userId: string) {
    return betaTasksService.completeTask(taskId, userId);
  }
}

export const betaTestingService = new BetaTestingService();
