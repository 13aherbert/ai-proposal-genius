
import { useSubscription } from "./use-subscription";

export type FeatureName = 
  | "rfp_summary" 
  | "proposal_outline" 
  | "proposal_draft" 
  | "compiled_draft" 
  | "evaluation";

export function useSubscriptionFeatures() {
  const { subscription, loading: isLoading, error } = useSubscription();

  const hasFeature = (feature: FeatureName): boolean => {
    if (isLoading || error) return false;

    // Default to trial plan if no subscription data
    const currentPlan = subscription?.plan_type || 'trial';

    // Pro tier has access to all features
    if (currentPlan === 'pro') return true;

    // Starter tier has access to basic features
    if (currentPlan === 'starter') {
      return ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
    }

    // Trial tier now has access to RFP summary, proposal outline, and proposal draft
    if (currentPlan === 'trial') {
      return ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
    }

    return false;
  };

  const getProjectLimit = (): number => {
    if (subscription?.project_limit) {
      return subscription.project_limit;
    }
    
    const currentPlan = subscription?.plan_type || 'trial';
    
    switch (currentPlan) {
      case 'pro':
        return 30;
      case 'starter':
        return 10;
      case 'trial':
        return 3;
      default:
        return 3;
    }
  };

  const getPlanName = (feature: FeatureName): string => {
    switch (feature) {
      case 'rfp_summary':
        return 'Advanced AI RFP Summary';
      case 'proposal_outline':
        return 'Enhanced AI Proposal Outline';
      case 'proposal_draft':
        return subscription?.plan_type === 'pro' ? 'Advanced AI Proposal Draft' : 'Basic AI Proposal Draft';
      case 'compiled_draft':
        return 'Compiled Draft Preview';
      case 'evaluation':
        return 'AI Proposal Evaluation';
      default:
        return '';
    }
  };

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading,
    error,
    plan: subscription?.plan_type
  };
}
