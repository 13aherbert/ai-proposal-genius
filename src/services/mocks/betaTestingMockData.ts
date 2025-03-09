
import { BetaFeedbackData, BetaMetrics } from '../BetaTestingService';

export const mockFeedbackItems = (userId: string): BetaFeedbackData[] => [
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

export const mockBetaMetrics: BetaMetrics = {
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

export const mockBetaTestingTasks = {
  active: [
    {
      id: '1',
      title: "Test RFP Document Upload",
      description: "Try uploading different document formats and verify correct parsing",
      priority: "high" as const
    },
    {
      id: '2',
      title: "Create a Complex Proposal",
      description: "Test the proposal editor with multiple sections and formatting",
      priority: "medium" as const
    },
    {
      id: '3',
      title: "Verify Knowledge Base Integration",
      description: "Check that Knowledge Base entries are correctly suggested in proposal drafts",
      priority: "low" as const
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
