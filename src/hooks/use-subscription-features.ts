
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
  getSafeProjectLimit,
  storeSubscriptionDataLocally,
  getStoredSubscriptionData
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
  const [lastPlanType, setLastPlanType] = useState<string | null>(null);
  const [forceRefreshFlag, setForceRefreshFlag] = useState(0);
  const [localProjectLimit, setLocalProjectLimit] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fallbackSubscription, setFallbackSubscription] = useState<any>(null);
  
  // Initialize with stored data on mount
  useEffect(() => {
    const storedData = getStoredSubscriptionData();
    if (storedData && !fallbackSubscription) {
      console.log("Using stored subscription data as fallback:", storedData);
      setFallbackSubscription(storedData);
      
      // Set initial project limit from stored data
      const normalizedPlan = (storedData.plan_type || '').toLowerCase();
      const safeLimit = getSafeProjectLimit(normalizedPlan, storedData.project_limit);
      setLocalProjectLimit(safeLimit);
    }
  }, []);
  
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
    
    // Store subscription data in localStorage when it's available
    if (subscription) {
      console.log("useSubscriptionFeatures - Plan type:", subscription.plan_type);
      console.log("useSubscriptionFeatures - Project limit:", subscription.project_limit);
      
      // Store subscription data for offline access and faster loading
      storeSubscriptionDataLocally(subscription);
      
      // Special case: normalize plan type strings for comparison
      const normalizedPlanType = (subscription.plan_type || '').toLowerCase();
      
      // Set local project limit for faster access
      const safeLimit = getSafeProjectLimit(normalizedPlanType, subscription.project_limit);
      setLocalProjectLimit(safeLimit);
      
      // Check to ensure starter plans have correct project limit
      if (normalizedPlanType === 'starter' && subscription.project_limit !== 10) {
        console.log("Detected incorrect project limit for starter plan. Refreshing subscription data.");
        // Force a subscription check to correct the data
        checkSubscription(true);
      }
      
      // Detect subscription plan changes
      if (lastPlanType !== null && lastPlanType !== normalizedPlanType) {
        console.log(`Plan type changed from ${lastPlanType} to ${normalizedPlanType}. Clearing caches.`);
        clearFeatureCaches();
      }
      
      // Update last plan type
      setLastPlanType(normalizedPlanType);
      
      // Store project limit in window cache for faster access
      if (window.projectLimitCache) {
        window.projectLimitCache.set(normalizedPlanType, safeLimit);
      }
    }
    
    // Debug features
    if (subscription?.features) {
      console.log("useSubscriptionFeatures - Features:", subscription.features);
    }
    
    setHasInitialized(true);
  }, [subscription, isLoading, error, testMode, checkSubscription, lastPlanType]);

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
  
  // Force refresh of subscription data periodically but less frequently
  useEffect(() => {
    if (!testMode) {
      const refreshInterval = setInterval(() => {
        console.log("Periodic refresh of subscription data");
        checkSubscription(true);
        setForceRefreshFlag(prev => prev + 1);
      }, 120000); // Every 2 minutes instead of 1 minute
      
      return () => clearInterval(refreshInterval);
    }
  }, [testMode, checkSubscription]);

  const hasFeature = useCallback((feature: FeatureName): boolean => {
    // If test mode is enabled, use the test plan from localStorage
    let currentPlan: string;
    
    if (testMode) {
      currentPlan = getTestPlan();
      console.log("Using test plan:", currentPlan);
    } else {
      if (isLoading && !hasInitialized) {
        console.log("Subscription still loading, checking for fallback data");
        
        // Try to use fallback subscription data
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          console.log("Using fallback subscription data with plan:", fallbackPlan);
          
          // Determine if the user has access to this feature based on fallback data
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        
        // For certain features, we can provide default access while loading
        if (feature === 'rfp_summary' || feature === 'proposal_outline' || feature === 'proposal_draft') {
          return true; // These features are available in all plans
        }
        
        return false;
      }
      
      if (error) {
        console.error("Error loading subscription:", error);
        // Try to use fallback subscription data if there's an error
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        return false;
      }
      
      if (!subscription) {
        console.log("No subscription data available, using fallback or trial defaults");
        
        // Try to use fallback subscription data
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        
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
    
    console.log(`Feature access for ${feature} on plan ${currentPlan}: ${hasAccess}`);
    
    // Cache the result
    featureCache.set(cacheKey, hasAccess);
    return hasAccess;
  }, [subscription, isLoading, error, testMode, hasInitialized, fallbackSubscription]);

  const getProjectLimit = useCallback((): number => {
    // If test mode is enabled, use the test project limit from localStorage
    if (testMode) {
      return getTestProjectLimit();
    }
    
    // If we have a local cached value, use it for performance
    if (localProjectLimit !== null) {
      return localProjectLimit;
    }
    
    // Use fallback subscription data if available and if still loading
    if (isLoading && fallbackSubscription) {
      const normalizedPlan = (fallbackSubscription.plan_type || '').toLowerCase();
      
      // For starter plans, enforce 10 project limit
      if (normalizedPlan === 'starter') {
        return SUBSCRIPTION_PLAN_LIMITS.starter; // 10
      }
      
      // Use the safe project limit function to get the correct limit from fallback
      const safeLimit = getSafeProjectLimit(normalizedPlan, fallbackSubscription.project_limit);
      console.log(`Using fallback project limit for ${normalizedPlan}: ${safeLimit}`);
      return safeLimit;
    }
    
    // While loading with no fallback, we can't determine the exact limit, so return a safe default
    if (isLoading && !fallbackSubscription) {
      console.log("Subscription loading, returning default project limit");
      return 3; // Trial default
    }
    
    // If we have subscription data, determine the limit based on plan type
    if (subscription) {
      // Normalize plan type to lowercase
      const normalizedPlan = (subscription.plan_type || '').toLowerCase();
      
      // CRITICAL: For starter plans, always return 10 regardless of stored limit
      if (normalizedPlan === 'starter') {
        console.log("Starter plan detected, enforcing 10 project limit");
        return 10;
      }
      
      // Use the safe project limit function to get the correct limit
      const safeLimit = getSafeProjectLimit(normalizedPlan, subscription.project_limit);
      
      console.log(`Using safe project limit for ${normalizedPlan}: ${safeLimit}`);
      return safeLimit;
    }
    
    // Fallback to trial limit
    return 3;
  }, [subscription, isLoading, testMode, localProjectLimit, fallbackSubscription]);

  const getPlanName = useCallback((feature: FeatureName): string => {
    let currentPlan: string;
    
    if (testMode) {
      currentPlan = getTestPlan();
    } else if (subscription) {
      currentPlan = (subscription.plan_type || 'trial').toLowerCase();
    } else if (fallbackSubscription) {
      currentPlan = (fallbackSubscription.plan_type || 'trial').toLowerCase();
    } else {
      currentPlan = 'trial';
    }
      
    return getFeatureName(feature, currentPlan);
  }, [subscription, testMode, fallbackSubscription]);

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
  
  // Force refresh subscription data
  const refreshSubscription = useCallback(() => {
    console.log("Manual refresh of subscription data requested");
    clearFeatureCaches();
    
    // Clear any local cached values
    setLocalProjectLimit(null);
    
    // Clear localStorage caches
    try {
      localStorage.removeItem('projectLimit');
      localStorage.removeItem('subscriptionData');
      if (window.featureCache) {
        window.featureCache.clear();
      }
      if (window.projectLimitCache) {
        window.projectLimitCache.clear();
      }
    } catch (e) {
      console.error("Error clearing local storage caches:", e);
    }
    
    // Force subscription refresh
    checkSubscription(true);
    setForceRefreshFlag(prev => prev + 1);
    
    // If the user is on a starter plan, manually update the local limit to 10
    if (subscription?.plan_type?.toLowerCase() === 'starter') {
      console.log("Starter plan detected during refresh, manually setting project limit to 10");
      setLocalProjectLimit(10);
    }
  }, [checkSubscription, subscription]);

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading: testMode ? false : (isLoading && !fallbackSubscription),
    error: testMode ? null : error,
    plan: testMode ? getTestPlan() : 
          subscription ? (subscription.plan_type || 'trial').toLowerCase() : 
          fallbackSubscription ? (fallbackSubscription.plan_type || 'trial').toLowerCase() : 
          'trial',
    isTestMode: testMode,
    enableTestMode,
    disableTestMode,
    refreshSubscription
  };
}
