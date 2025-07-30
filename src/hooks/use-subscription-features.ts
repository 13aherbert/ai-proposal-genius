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
  getStoredSubscriptionData,
  isUserOfPlanType
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
  const [logCount, setLogCount] = useState(0);
  
  const devLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && logCount < 3) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
      setLogCount(prev => prev + 1);
    }
  };
  
  useEffect(() => {
    const storedData = getStoredSubscriptionData();
    if (storedData && !fallbackSubscription) {
      devLog("Using stored subscription data as fallback:", storedData);
      setFallbackSubscription(storedData);
      
      const normalizedPlan = (storedData.plan_type || '').toLowerCase();
      const safeLimit = getSafeProjectLimit(normalizedPlan, storedData.project_limit);
      setLocalProjectLimit(safeLimit);
    }
  }, []);
  
  useEffect(() => {
    const isTestMode = isTestModeEnabled();
    setTestMode(isTestMode);
    
    if (isTestMode !== testMode) {
      clearFeatureCaches();
    }

    if (subscription) {
      devLog("useSubscriptionFeatures - Plan type:", subscription.plan_type);
      
      storeSubscriptionDataLocally(subscription);
      
      const normalizedPlanType = (subscription.plan_type || '').toLowerCase();
      
      const safeLimit = getSafeProjectLimit(normalizedPlanType, subscription.project_limit);
      setLocalProjectLimit(safeLimit);
      
      if (normalizedPlanType === 'starter' && subscription.project_limit !== 10) {
        devLog("Detected incorrect project limit for starter plan. Refreshing subscription data.");
        checkSubscription();
      }
      
      if (lastPlanType !== null && lastPlanType !== normalizedPlanType) {
        devLog(`Plan type changed from ${lastPlanType} to ${normalizedPlanType}. Clearing caches.`);
        clearFeatureCaches();
      }
      
      setLastPlanType(normalizedPlanType);
      
      if (window.projectLimitCache) {
        window.projectLimitCache.set(normalizedPlanType, safeLimit);
      }
    }
    
    setHasInitialized(true);
  }, [subscription, testMode, checkSubscription, lastPlanType]);
  
  useEffect(() => {
    if (subscription) {
      const cacheKey = `${subscription.subscription_id}-${subscription.plan_type}-${subscription.status}`;
      if (!featureCache.has(cacheKey)) {
        devLog("Clearing feature cache, subscription changed");
        clearFeatureCaches();
      }
    }
  }, [subscription]);
  
  useEffect(() => {
    if (!testMode) {
      const refreshInterval = setInterval(() => {
        devLog("Periodic refresh of subscription data");
        checkSubscription();
        setForceRefreshFlag(prev => prev + 1);
      }, 180000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [testMode, checkSubscription]);
  
  const hasFeature = useCallback((feature: FeatureName): boolean => {
    let currentPlan: string;
    
    if (testMode) {
      currentPlan = getTestPlan();
      devLog("Using test plan:", currentPlan);
    } else {
      if (isLoading && !hasInitialized) {
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        
        if (feature === 'rfp_summary' || feature === 'proposal_outline' || feature === 'proposal_draft') {
          return true;
        }
        
        return false;
      }
      
      if (error) {
        console.error("Error loading subscription:", error);
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        return false;
      }
      
      if (!subscription) {
        if (fallbackSubscription) {
          const fallbackPlan = (fallbackSubscription.plan_type || '').toLowerCase();
          const hasAccess = determineFeatureAccess(feature, fallbackPlan);
          return hasAccess;
        }
        
        return feature === "rfp_summary" || feature === "proposal_outline" || feature === "proposal_draft";
      }
      
      currentPlan = (subscription.plan_type || '').toLowerCase();
    }
    
    const cacheKey = `${currentPlan}-${feature}`;
    if (featureCache.has(cacheKey)) {
      const cachedResult = featureCache.get(cacheKey);
      return cachedResult as boolean;
    }
    
    const hasAccess = determineFeatureAccess(feature, currentPlan);
    featureCache.set(cacheKey, hasAccess);
    return hasAccess;
  }, [subscription, isLoading, error, testMode, hasInitialized, fallbackSubscription]);
  
  const getProjectLimit = useCallback((): number => {
    if (testMode) {
      return getTestProjectLimit();
    }
    
    const subscriptionData = getStoredSubscriptionData();
    
    if (subscriptionData && subscriptionData.plan_type) {
      const planType = subscriptionData.plan_type.toLowerCase();
      
      if (planType === 'pro') {
        return SUBSCRIPTION_PLAN_LIMITS.pro;
      } else if (planType === 'basic') {
        return SUBSCRIPTION_PLAN_LIMITS.basic;
      } else if (planType === 'starter') {
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
    }
    
    if (localProjectLimit !== null) {
      return localProjectLimit;
    }
    
    if (isLoading && fallbackSubscription) {
      const normalizedPlan = (fallbackSubscription.plan_type || '').toLowerCase();
      
      if (normalizedPlan === 'starter') {
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      } else if (normalizedPlan === 'basic') {
        return SUBSCRIPTION_PLAN_LIMITS.basic;
      } else if (normalizedPlan === 'pro') {
        return SUBSCRIPTION_PLAN_LIMITS.pro;
      }
      
      const safeLimit = getSafeProjectLimit(normalizedPlan, fallbackSubscription.project_limit);
      return safeLimit;
    }
    
    if (isLoading && !fallbackSubscription) {
      return 3;
    }
    
    if (subscription) {
      const normalizedPlan = (subscription.plan_type || '').toLowerCase();
      
      if (normalizedPlan === 'pro') {
        return SUBSCRIPTION_PLAN_LIMITS.pro;
      } else if (normalizedPlan === 'basic') {
        return SUBSCRIPTION_PLAN_LIMITS.basic;
      } else if (normalizedPlan === 'starter') {
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      const safeLimit = getSafeProjectLimit(normalizedPlan, subscription.project_limit);
      return safeLimit;
    }
    
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
  
  const enableTestMode = useCallback((planType: 'starter' | 'basic' | 'pro' = 'starter') => {
    enableTestModeUtil(planType);
    setTestMode(true);
    clearFeatureCaches();
  }, []);
  
  const disableTestMode = useCallback(() => {
    disableTestModeUtil();
    setTestMode(false);
    clearFeatureCaches();
  }, []);
  
  const refreshSubscription = useCallback(() => {
    devLog("Manual refresh of subscription data requested");
    clearFeatureCaches();
    
    setLocalProjectLimit(null);
    
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
    
    checkSubscription();
    setForceRefreshFlag(prev => prev + 1);
    
    if (subscription?.plan_type?.toLowerCase() === 'starter') {
      devLog("Starter plan detected during refresh, manually setting project limit to 10");
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
