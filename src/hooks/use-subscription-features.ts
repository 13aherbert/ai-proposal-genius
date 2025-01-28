import { useSubscription } from "./use-subscription";

export type FeatureName = 
  | "rfp_summary" 
  | "proposal_outline" 
  | "proposal_draft" 
  | "compiled_draft" 
  | "evaluation";

export function useSubscriptionFeatures() {
  const { data: subscription, isLoading, error } = useSubscription();

  const hasFeature = (feature: FeatureName): boolean => {
    if (isLoading || error || !subscription) return false;

    // Pro tier has access to all features
    if (subscription.plan === 'pro') return true;

    // Starter tier has access to basic features
    if (subscription.plan === 'starter') {
      return ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
    }

    // Trial tier has access to only RFP summary
    if (subscription.plan === 'trial') {
      return ['rfp_summary'].includes(feature);
    }

    return false;
  };

  const getProjectLimit = (): number => {
    if (!subscription?.plan) return 3; // Trial limit
    switch (subscription.plan) {
      case 'pro':
        return 30;
      case 'starter':
        return 10;
      case 'trial':
        return 3;
      default:
        return 0;
    }
  };

  const getPlanName = (feature: FeatureName): string => {
    switch (feature) {
      case 'rfp_summary':
        return 'Advanced AI RFP Summary';
      case 'proposal_outline':
        return 'Enhanced AI Proposal Outline';
      case 'proposal_draft':
        return subscription?.plan === 'pro' ? 'Advanced AI Proposal Draft' : 'Basic AI Proposal Draft';
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
    plan: subscription?.plan
  };
}