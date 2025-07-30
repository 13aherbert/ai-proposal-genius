
export type FeatureName = 
  | 'rfp_summary'
  | 'proposal_outline'
  | 'proposal_draft'
  | 'compiled_draft'  // Adding missing feature
  | 'evaluation'      // Adding missing feature
  | 'data_export'     // Adding missing feature
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
  enableTestMode: (planType?: 'starter' | 'basic' | 'pro') => void;
  disableTestMode: () => void;
  refreshSubscription: () => void;
}
