
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
  clearFeatureCaches,
  getProjectLimitForPlan,
  getSafeProjectLimit
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
  const { data: subscription, isLoading, error, checkSubscription } = useSubscription();
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
    
    if (subscription) {
      console.log("useSubscriptionFeatures - Plan type:", subscription.plan_type);
      console.log("useSubscriptionFeatures - Project limit:", subscription.project_limit);
      
      // Special case: normalize plan type strings for comparison
      const normalizedPlanType = (subscription.plan_type || '').toLowerCase();
      
      // Check to ensure starter plans have correct project limit
      if (normalizedPlanType === 'starter' && subscription.project_limit !== 10) {
        console.log("Detected incorrect project limit for starter plan. Refreshing subscription data.");
        // Force a subscription check to correct the data
        checkSubscription(true);
      }
    }
    
    // Debug features
    if (subscription?.features) {
      console.log("useSubscriptionFeatures - Features:", subscription.features);
    }
  }, [subscription, isLoading, error, testMode, checkSubscription]);

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
        
        // For certain features, we can provide default access while loading
        if (feature === 'rfp_summary' || feature === 'proposal_outline' || feature === 'proposal_draft') {
          return true; // These features are available in all plans
        }
        
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
      // Normalize the plan type to lowercase for consistent comparison
      currentPlan = (subscription.plan_type || '').toLowerCase();
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
    // If test mode is enabled, use the test project limit from localStorage
    if (testMode) {
      return getTestProjectLimit();
    }
    
    // While loading, we can't determine the exact limit, so return a safe default
    if (isLoading) {
      console.log("Subscription loading, returning default project limit");
      return 3; // Trial default
    }
    
    // If we have subscription data, determine the limit based on plan type
    if (subscription) {
      // Normalize plan type to lowercase
      const normalizedPlan = (subscription.plan_type || '').toLowerCase();
      
      // Use the safe project limit function to get the correct limit
      const safeLimit = getSafeProjectLimit(normalizedPlan, subscription.project_limit);
      
      console.log(`Using safe project limit for ${normalizedPlan}: ${safeLimit}`);
      return safeLimit;
    }
    
    // Fallback to trial limit
    return 3;
  }, [subscription, isLoading, testMode]);

  const getPlanName = useCallback((feature: FeatureName): string => {
    const currentPlan = testMode 
      ? getTestPlan()
      : (subscription?.plan_type || 'trial').toLowerCase();
      
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
    plan: testMode ? getTestPlan() : (subscription?.plan_type || 'trial').toLowerCase(),
    isTestMode: testMode,
    enableTestMode,
    disableTestMode
  };
}
