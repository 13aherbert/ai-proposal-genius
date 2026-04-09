import { useSubscription } from "./use-subscription";
import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { 
  FeatureName, 
  SubscriptionFeaturesResult 
} from "./subscription/subscription-features-types";
import { usePricingTier } from "./use-pricing-tier";
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
  normalizePlanType,
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
  const logCountRef = useRef(0);
  
  const devLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && logCountRef.current < 3) {
      if (data) console.log(message, data);
      else console.log(message);
      logCountRef.current += 1;
    }
  };
  
  useEffect(() => {
    const storedData = getStoredSubscriptionData();
    if (storedData && !fallbackSubscription) {
      devLog("Using stored subscription data as fallback:", storedData);
      setFallbackSubscription(storedData);
      const normalizedPlan = normalizePlanType(storedData.plan_type);
      const safeLimit = getSafeProjectLimit(normalizedPlan, storedData.project_limit);
      setLocalProjectLimit(safeLimit);
    }
  }, []);
  
  useEffect(() => {
    const isTestMode = isTestModeEnabled();
    setTestMode(isTestMode);
    
    if (isTestMode !== testMode) clearFeatureCaches();

    if (subscription) {
      devLog("useSubscriptionFeatures - Plan type:", subscription.plan_type);
      storeSubscriptionDataLocally(subscription);
      
      const normalizedPlanType = normalizePlanType(subscription.plan_type);
      const safeLimit = getSafeProjectLimit(normalizedPlanType, subscription.project_limit);
      setLocalProjectLimit(safeLimit);
      
      
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
    } else {
      if (isLoading && !hasInitialized) {
        if (fallbackSubscription) {
          return determineFeatureAccess(feature, normalizePlanType(fallbackSubscription.plan_type));
        }
        if (feature === 'rfp_summary' || feature === 'proposal_outline' || feature === 'proposal_draft') return true;
        return false;
      }
      
      if (error) {
        if (fallbackSubscription) return determineFeatureAccess(feature, normalizePlanType(fallbackSubscription.plan_type));
        return false;
      }
      
      if (!subscription) {
        if (fallbackSubscription) return determineFeatureAccess(feature, normalizePlanType(fallbackSubscription.plan_type));
        return feature === "rfp_summary" || feature === "proposal_outline" || feature === "proposal_draft";
      }
      
      currentPlan = normalizePlanType(subscription.plan_type);
    }
    
    const cacheKey = `${currentPlan}-${feature}`;
    if (featureCache.has(cacheKey)) return featureCache.get(cacheKey) as boolean;
    
    const hasAccess = determineFeatureAccess(feature, currentPlan);
    featureCache.set(cacheKey, hasAccess);
    return hasAccess;
  }, [subscription, isLoading, error, testMode, hasInitialized, fallbackSubscription]);
  
  const getProjectLimit = useCallback((): number => {
    if (testMode) return getTestProjectLimit();
    
    const subscriptionData = getStoredSubscriptionData();
    if (subscriptionData?.plan_type) {
      return getProjectLimitForPlan(subscriptionData.plan_type);
    }
    
    if (localProjectLimit !== null) return localProjectLimit;
    
    if (isLoading && fallbackSubscription) {
      return getSafeProjectLimit(normalizePlanType(fallbackSubscription.plan_type), fallbackSubscription.project_limit);
    }
    
    if (isLoading && !fallbackSubscription) return 6;
    
    if (subscription) {
      return getSafeProjectLimit(normalizePlanType(subscription.plan_type), subscription.project_limit);
    }
    
    return 6;
  }, [subscription, isLoading, testMode, localProjectLimit, fallbackSubscription]);
  
  const getPlanName = useCallback((feature: FeatureName): string => {
    let currentPlan: string;
    
    if (testMode) currentPlan = getTestPlan();
    else if (subscription) currentPlan = normalizePlanType(subscription.plan_type);
    else if (fallbackSubscription) currentPlan = normalizePlanType(fallbackSubscription.plan_type);
    else currentPlan = 'starter';
      
    return getFeatureName(feature, currentPlan);
  }, [subscription, testMode, fallbackSubscription]);
  
  const enableTestMode = useCallback((planType: 'starter' | 'growth' | 'business' | 'enterprise' = 'starter') => {
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
      if (window.featureCache) window.featureCache.clear();
      if (window.projectLimitCache) window.projectLimitCache.clear();
    } catch (e) {
      console.error("Error clearing local storage caches:", e);
    }
    
    checkSubscription();
    setForceRefreshFlag(prev => prev + 1);
  }, [checkSubscription]);
  
  const currentPlan = testMode ? getTestPlan() : 
    subscription ? normalizePlanType(subscription.plan_type) : 
    fallbackSubscription ? normalizePlanType(fallbackSubscription.plan_type) : 
    'starter';

  const { tier: pricingTier, canAddUser, getUserLimitDisplay, getUpgradeValueProp } = usePricingTier(currentPlan);

  return {
    hasFeature,
    getProjectLimit,
    getPlanName,
    isLoading: testMode ? false : (isLoading && !fallbackSubscription),
    error: testMode ? null : error,
    plan: currentPlan,
    isTestMode: testMode,
    enableTestMode,
    disableTestMode,
    refreshSubscription,
    pricingTier,
    canAddUser,
    getUserLimitDisplay,
    getUpgradeValueProp,
  };
}
