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
    return subscription.plan === 'pro' || 
           (subscription.plan === 'starter' && ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature)) ||
           (subscription.plan === 'trial' && ['rfp_summary'].includes(feature));
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

  return {
    hasFeature,
    getProjectLimit,
    isLoading,
    error,
    plan: subscription?.plan
  };
}