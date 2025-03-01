
import { useSubscription } from "./use-subscription";
import { useCallback } from "react";

export type FeatureName = 
  | "rfp_summary" 
  | "proposal_outline" 
  | "proposal_draft" 
  | "compiled_draft" 
  | "evaluation"
  | "data_export";

// Cache for feature availability to avoid recalculations
const featureCache = new Map<string, boolean>();
const projectLimitCache = new Map<string, number>();

export function useSubscriptionFeatures() {
  const { data: subscription, isLoading, error } = useSubscription();

  // Clear feature cache when subscription changes
  if (subscription) {
    const cacheKey = `${subscription.id}-${subscription.plan_type}-${subscription.status}`;
    if (!featureCache.has(cacheKey)) {
      featureCache.clear();
      projectLimitCache.clear();
    }
  }

  const hasFeature = useCallback((feature: FeatureName): boolean => {
    if (isLoading || error) return false;

    const currentPlan = subscription?.plan_type || 'trial';
    
    // Use cached value if available
    const cacheKey = `${currentPlan}-${feature}`;
    if (featureCache.has(cacheKey)) {
      return featureCache.get(cacheKey) as boolean;
    }
    
    let hasAccess = false;
    
    // Pro tier has access to all features
    if (currentPlan === 'pro') {
      hasAccess = true;
    }
    // Starter tier has access to basic features
    else if (currentPlan === 'starter') {
      hasAccess = ['rfp_summary', 'proposal_outline', 'proposal_draft', 'data_export'].includes(feature);
    }
    // Trial tier now has access to RFP summary, proposal outline, and proposal draft
    else if (currentPlan === 'trial') {
      hasAccess = ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
    }
    
    // Cache the result
    featureCache.set(cacheKey, hasAccess);
    return hasAccess;
  }, [subscription, isLoading, error]);

  const getProjectLimit = useCallback((): number => {
    const currentPlan = subscription?.plan_type || 'trial';
    
    // Use cached value if available
    const cacheKey = `${currentPlan}-limit`;
    if (projectLimitCache.has(cacheKey)) {
      return projectLimitCache.get(cacheKey) as number;
    }
    
    let limit: number;
    
    if (subscription?.project_limit) {
      limit = subscription.project_limit;
    } else {
      switch (currentPlan) {
        case 'pro':
          limit = 30;
        case 'starter':
          limit = 10;
        case 'trial':
        default:
          limit = 3;
      }
    }
    
    // Cache the result
    projectLimitCache.set(cacheKey, limit);
    return limit;
  }, [subscription]);

  const getPlanName = useCallback((feature: FeatureName): string => {
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
      case 'data_export':
        return 'Data Export Feature';
      default:
        return '';
    }
  }, [subscription]);

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading,
    error,
    plan: subscription?.plan_type // Use plan_type for backward compatibility
  };
}
