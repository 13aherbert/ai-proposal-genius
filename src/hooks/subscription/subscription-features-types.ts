
export interface PricingTier {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number | null;
  projects_limit: number;
  users_limit: number;
  features: string[];
  is_active: boolean;
}

export type FeatureName = 
  | 'rfp_summary'
  | 'proposal_outline'
  | 'proposal_draft'
  | 'compiled_draft'
  | 'evaluation'
  | 'auto_proposal_generation'
  | 'data_export'
  | 'ai_editor'
  | 'team_collaboration'
  | 'advanced_analytics'
  | 'api_access'
  | 'white_labeling'
  | 'design_studio'
  | 'priority_support'
  | 'custom_templates'
  | 'opportunity_search';

export interface SubscriptionFeaturesResult {
  hasFeature: (feature: FeatureName) => boolean;
  getProjectLimit: () => number;
  getPlanName: (feature: FeatureName) => string;
  isLoading: boolean;
  error: Error | null;
  plan: string;
  isTestMode: boolean;
  enableTestMode: (planType?: 'starter' | 'growth' | 'business' | 'enterprise') => void;
  disableTestMode: () => void;
  refreshSubscription: () => void;
  // Pricing tier helpers
  pricingTier: PricingTier | null;
  canAddUser: (teamSize: number) => boolean;
  getUserLimitDisplay: () => string;
  getUpgradeValueProp: () => string;
}
