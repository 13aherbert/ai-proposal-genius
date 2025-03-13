
export type FeatureName = 
  | 'rfp_summary'
  | 'proposal_outline'
  | 'proposal_draft'
  | 'ai_editor'
  | 'team_collaboration'
  | 'advanced_analytics'
  | 'api_access'
  | 'white_labeling'
  | 'priority_support'
  | 'custom_templates';

export interface SubscriptionFeaturesResult {
  hasFeature: (feature: FeatureName) => boolean;
  getProjectLimit: () => number;
  getPlanName: (feature: FeatureName) => string;
  isLoading: boolean;
  error: Error | null;
  plan: string;
  isTestMode: boolean;
  enableTestMode: (planType?: 'trial' | 'starter' | 'pro') => void;
  disableTestMode: () => void;
  refreshSubscription: () => void;
}
