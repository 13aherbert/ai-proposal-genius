
import { useSubscription } from "./use-subscription";
import { useCallback, useEffect, useState } from "react";

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
  const [testMode, setTestMode] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if test mode is enabled from localStorage
    const isTestMode = localStorage.getItem('test_mode') === 'true';
    setTestMode(isTestMode);
    
    // Clear cache when component mounts if test mode changes
    if (isTestMode !== testMode) {
      featureCache.clear();
      projectLimitCache.clear();
    }

    // Log subscription data for debugging
    console.log("useSubscriptionFeatures - Subscription data:", subscription);
    console.log("useSubscriptionFeatures - Loading:", isLoading);
    console.log("useSubscriptionFeatures - Error:", error);
    console.log("useSubscriptionFeatures - Test mode:", isTestMode);
    console.log("useSubscriptionFeatures - Plan type:", subscription?.plan_type);
    
    // Debug features
    if (subscription?.features) {
      console.log("useSubscriptionFeatures - Features:", subscription.features);
    }
  }, [subscription, isLoading, error, testMode]);

  // Clear feature cache when subscription changes
  useEffect(() => {
    if (subscription) {
      const cacheKey = `${subscription.subscription_id}-${subscription.plan_type}-${subscription.status}`;
      if (!featureCache.has(cacheKey)) {
        console.log("Clearing feature cache, subscription changed");
        featureCache.clear();
        projectLimitCache.clear();
      }
    }
  }, [subscription]);

  const hasFeature = useCallback((feature: FeatureName): boolean => {
    // If test mode is enabled, use the test plan from localStorage
    let currentPlan: string;
    
    if (testMode) {
      currentPlan = localStorage.getItem('test_plan') || 'trial';
      console.log("Using test plan:", currentPlan);
    } else {
      if (isLoading) {
        console.log("Subscription still loading, deferring feature check");
        return false;
      }
      
      if (error) {
        console.error("Error loading subscription:", error);
        return false;
      }
      
      if (!subscription) {
        console.log("No subscription data available, using trial defaults");
        return feature === "rfp_summary" || feature === "proposal_outline" || feature === "proposal_draft";
      }
      
      console.log("Using subscription plan:", subscription.plan_type, "with status:", subscription.status);
      currentPlan = subscription.plan_type || 'trial';
    }
    
    // Use cached value if available
    const cacheKey = `${currentPlan}-${feature}`;
    if (featureCache.has(cacheKey)) {
      const cachedResult = featureCache.get(cacheKey);
      console.log(`Using cached feature access for ${feature} on plan ${currentPlan}: ${cachedResult}`);
      return cachedResult as boolean;
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
    
    // For development testing, enable all features
    if (process.env.NODE_ENV === 'development') {
      // Uncomment next line to enable all features in development
      // hasAccess = true;
    }
    
    console.log(`Feature access for ${feature} on plan ${currentPlan}: ${hasAccess}`);
    
    // Cache the result
    featureCache.set(cacheKey, hasAccess);
    return hasAccess;
  }, [subscription, isLoading, error, testMode]);

  const getProjectLimit = useCallback((): number => {
    let limit: number;
    
    // If test mode is enabled, use the test project limit from localStorage
    if (testMode) {
      limit = parseInt(localStorage.getItem('test_project_limit') || '3');
    } else {
      const currentPlan = subscription?.plan_type || 'trial';
      
      // Use cached value if available
      const cacheKey = `${currentPlan}-limit`;
      if (projectLimitCache.has(cacheKey)) {
        return projectLimitCache.get(cacheKey) as number;
      }
      
      if (subscription?.project_limit) {
        limit = subscription.project_limit;
      } else {
        switch (currentPlan) {
          case 'pro':
            limit = 30;
            break;
          case 'starter':
            limit = 10;
            break;
          case 'trial':
          default:
            limit = 3;
            break;
        }
      }
      
      // Cache the result
      projectLimitCache.set(cacheKey, limit);
    }
    
    return limit;
  }, [subscription, testMode]);

  const getPlanName = useCallback((feature: FeatureName): string => {
    const currentPlan = testMode 
      ? localStorage.getItem('test_plan') || 'trial'
      : subscription?.plan_type || 'trial';
      
    switch (feature) {
      case 'rfp_summary':
        return 'Advanced AI RFP Summary';
      case 'proposal_outline':
        return 'Enhanced AI Proposal Outline';
      case 'proposal_draft':
        return currentPlan === 'pro' ? 'Advanced AI Proposal Draft' : 'Basic AI Proposal Draft';
      case 'compiled_draft':
        return 'Compiled Draft Preview';
      case 'evaluation':
        return 'AI Proposal Evaluation';
      case 'data_export':
        return 'Data Export Feature';
      default:
        return '';
    }
  }, [subscription, testMode]);

  // Add helper to simulate a trial plan for testing
  const enableTestMode = useCallback((planType: 'trial' | 'starter' | 'pro' = 'trial') => {
    localStorage.setItem('test_mode', 'true');
    localStorage.setItem('test_plan', planType);
    setTestMode(true);
    featureCache.clear();
    projectLimitCache.clear();
    console.log(`Test mode enabled with plan: ${planType}`);
  }, []);

  // Disable test mode
  const disableTestMode = useCallback(() => {
    localStorage.removeItem('test_mode');
    localStorage.removeItem('test_plan');
    setTestMode(false);
    featureCache.clear();
    projectLimitCache.clear();
    console.log('Test mode disabled');
  }, []);

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading: testMode ? false : isLoading,
    error: testMode ? null : error,
    plan: testMode ? (localStorage.getItem('test_plan') as string || 'trial') : subscription?.plan_type,
    isTestMode: testMode,
    enableTestMode,
    disableTestMode
  };
}
