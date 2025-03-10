import { useSubscription } from "./use-subscription";
import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { 
  FeatureName, 
  SubscriptionFeaturesResult 
} from "./subscription/subscription-features-types";
import { 
  featureCache, 
  projectLimitCache, 
  determineFeatureAccess, 
  getFeatureName, 
  clearFeatureCaches 
} from "./subscription/feature-access";
import {
  isTestModeEnabled,
  getTestPlan,
  enableTestMode as enableTestModeUtil,
  disableTestMode as disableTestModeUtil,
  getTestProjectLimit
} from "./subscription/test-mode";

export type { FeatureName } from "./subscription/subscription-features-types";

export function useSubscriptionFeatures(): SubscriptionFeaturesResult {
  const { data: subscription, isLoading, error } = useSubscription();
  const [testMode, setTestMode] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if test mode is enabled from localStorage
    const isTestMode = isTestModeEnabled();
    setTestMode(isTestMode);
    
    // Clear cache when component mounts if test mode changes
    if (isTestMode !== testMode) {
      clearFeatureCaches();
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
        clearFeatureCaches();
      }
    }
  }, [subscription]);

  const hasFeature = useCallback((feature: FeatureName): boolean => {
    // If test mode is enabled, use the test plan from localStorage
    let currentPlan: string;
    
    if (testMode) {
      currentPlan = getTestPlan();
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
    
    // Determine if the user has access to this feature
    const hasAccess = determineFeatureAccess(feature, currentPlan);
    
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
      limit = getTestProjectLimit();
    } else {
      const currentPlan = subscription?.plan_type || 'trial';
      
      // Use cached value if available
      const cacheKey = `${currentPlan}-limit`;
      if (projectLimitCache.has(cacheKey)) {
        return projectLimitCache.get(cacheKey) as number;
      }
      
      // Check if subscription has a specific project_limit value
      if (subscription?.project_limit) {
        limit = subscription.project_limit;
      } else {
        // Use the constants defined in types
        limit = SUBSCRIPTION_PLAN_LIMITS[currentPlan as keyof typeof SUBSCRIPTION_PLAN_LIMITS] || SUBSCRIPTION_PLAN_LIMITS.trial;
        
        // Log for debugging
        console.log(`Using plan limit from constants: ${currentPlan} -> ${limit}`);
      }
      
      // Cache the result
      projectLimitCache.set(cacheKey, limit);
    }
    
    return limit;
  }, [subscription, testMode]);

  const getPlanName = useCallback((feature: FeatureName): string => {
    const currentPlan = testMode 
      ? getTestPlan()
      : subscription?.plan_type || 'trial';
      
    return getFeatureName(feature, currentPlan);
  }, [subscription, testMode]);

  const enableTestMode = useCallback((planType: 'trial' | 'starter' | 'pro' = 'trial') => {
    enableTestModeUtil(planType);
    setTestMode(true);
    clearFeatureCaches();
  }, []);

  const disableTestMode = useCallback(() => {
    disableTestModeUtil();
    setTestMode(false);
    clearFeatureCaches();
  }, []);

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading: testMode ? false : isLoading,
    error: testMode ? null : error,
    plan: testMode ? getTestPlan() : subscription?.plan_type,
    isTestMode: testMode,
    enableTestMode,
    disableTestMode
  };
}
