
/**
 * Types for subscription features
 */

/**
 * Feature names available in the application
 */
export type FeatureName = 
  | "rfp_summary" 
  | "proposal_outline" 
  | "proposal_draft" 
  | "compiled_draft" 
  | "evaluation"
  | "data_export";

/**
 * Return type for useSubscriptionFeatures hook
 */
export interface SubscriptionFeaturesResult {
  hasFeature: (feature: FeatureName) => boolean;
  getProjectLimit: () => number;
  getPlanName: (feature: FeatureName) => string;
  isLoading: boolean;
  error: Error | null;
  plan: string | undefined;
  isTestMode: boolean;
  enableTestMode: (planType?: 'trial' | 'starter' | 'pro') => void;
  disableTestMode: () => void;
}
