
export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';

export type FeedbackSeverity = 'low' | 'medium' | 'high';

export interface FeedbackFormData {
  name: string;
  email: string;
  comments: string;
  severity: FeedbackSeverity;
  feedbackType: FeedbackType;
  allowContact: boolean;
}
