
import { FeatureName } from "./subscription-features-types";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";

// Cache for feature availability to avoid recalculations
export const featureCache = new Map<string, boolean>();
export const projectLimitCache = new Map<string, number>();

// Initialize global cache for cross-component access
if (typeof window !== 'undefined') {
  window.featureCache = window.featureCache || featureCache;
  window.projectLimitCache = window.projectLimitCache || projectLimitCache;
}

/**
 * Normalizes plan type strings for consistent comparison
 */
export function normalizePlanType(planType: string | null | undefined): string {
  return (planType || 'trial').toLowerCase();
}

/**
 * Determines if a feature is available for a given plan
 */
export function determineFeatureAccess(
  feature: FeatureName, 
  currentPlan: string
): boolean {
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = normalizePlanType(currentPlan);
  
  // Generate a cache key for this feature check
  const cacheKey = `${normalizedPlan}-${feature}`;
  
  // Check if result is already cached
  if (window.featureCache && window.featureCache.has(cacheKey)) {
    return window.featureCache.get(cacheKey) as boolean;
  }
  
  let hasAccess = false;
  
  // Pro tier has access to all features
  if (normalizedPlan === 'pro') {
    hasAccess = true;
  }
  // Starter tier has access to basic features
  else if (normalizedPlan === 'starter') {
    hasAccess = ['rfp_summary', 'proposal_outline', 'proposal_draft', 'data_export'].includes(feature);
  }
  // Trial tier has access to RFP summary, proposal outline, and proposal draft
  else if (normalizedPlan === 'trial') {
    hasAccess = ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
  }
  
  // Cache the result for future checks
  if (window.featureCache) {
    window.featureCache.set(cacheKey, hasAccess);
  }

  return hasAccess;
}

/**
 * Gets human-readable feature name for a given plan
 */
export function getFeatureName(feature: FeatureName, currentPlan: string): string {
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = normalizePlanType(currentPlan);
  
  switch (feature) {
    case 'rfp_summary':
      return 'Advanced AI RFP Summary';
    case 'proposal_outline':
      return 'Enhanced AI Proposal Outline';
    case 'proposal_draft':
      return normalizedPlan === 'pro' ? 'Advanced AI Proposal Draft' : 'Basic AI Proposal Draft';
    case 'compiled_draft':
      return 'Compiled Draft Preview';
    case 'evaluation':
      return 'AI Proposal Evaluation';
    case 'data_export':
      return 'Data Export Feature';
    default:
      return '';
  }
}

/**
 * Gets the correct project limit for a plan type
 */
export function getProjectLimitForPlan(planType: string): number {
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = normalizePlanType(planType);
  
  // Check window cache first for performance
  if (window.projectLimitCache && window.projectLimitCache.has(normalizedPlan)) {
    const cachedLimit = window.projectLimitCache.get(normalizedPlan);
    console.log(`Using cached project limit for ${normalizedPlan}: ${cachedLimit}`);
    return cachedLimit as number;
  }
  
  let limit: number;
  
  // CRITICAL: Force exact limits for each plan type from constants
  if (normalizedPlan === 'pro') {
    limit = SUBSCRIPTION_PLAN_LIMITS.pro;
  } else if (normalizedPlan === 'starter') {
    // CRITICAL FIX: Always enforce exactly 10 projects for starter plans
    limit = SUBSCRIPTION_PLAN_LIMITS.starter;  // This is 10 as defined in types/subscription.ts
  } else {
    limit = SUBSCRIPTION_PLAN_LIMITS.trial; // Trial or unknown plan
  }
  
  // Cache the result
  if (window.projectLimitCache) {
    window.projectLimitCache.set(normalizedPlan, limit);
  }
  
  return limit;
}

/**
 * Safely gets project limit with fallback
 * This ensures we always have a valid project limit even if subscription data is loading
 */
export function getSafeProjectLimit(planType: string | undefined, storedLimit: number | undefined): number {
  // If we don't have either data point, use trial limit as default
  if (!planType && storedLimit === undefined) {
    return SUBSCRIPTION_PLAN_LIMITS.trial; // Trial default
  }
  
  // If we have a plan type, calculate the correct limit
  if (planType) {
    const normalizedPlan = normalizePlanType(planType);
    
    // CRITICAL FIX: For starter plans, ALWAYS FORCE exactly 10 projects, regardless of stored limit
    if (normalizedPlan === 'starter') {
      return SUBSCRIPTION_PLAN_LIMITS.starter; // Force to exactly 10 for all starter plans
    }
    
    // For other plans, use the correct limit based on plan type
    if (normalizedPlan === 'pro') {
      return SUBSCRIPTION_PLAN_LIMITS.pro;
    } else if (normalizedPlan === 'trial') {
      return SUBSCRIPTION_PLAN_LIMITS.trial;
    }
    
    // Fallback to stored limit if plan doesn't match known types
    return storedLimit !== undefined ? storedLimit : SUBSCRIPTION_PLAN_LIMITS.trial;
  }
  
  // If we only have storedLimit, use it (but correct it for starter plans)
  if (storedLimit !== undefined) {
    return storedLimit;
  }
  
  // Final fallback
  return SUBSCRIPTION_PLAN_LIMITS.trial;
}

/**
 * Clears all feature caches
 */
export function clearFeatureCaches(): void {
  console.log("Clearing feature and project limit caches");
  featureCache.clear();
  projectLimitCache.clear();
  
  // Clear global caches as well
  if (window.featureCache) {
    window.featureCache.clear();
  }
  if (window.projectLimitCache) {
    window.projectLimitCache.clear();
  }
  
  // Clear any localStorage values
  try {
    localStorage.removeItem('projectLimit');
    localStorage.removeItem('subscriptionData');
  } catch (e) {
    console.error("Error clearing localStorage:", e);
  }
}

/**
 * Store subscription data in localStorage for faster access and offline fallback
 */
export function storeSubscriptionDataLocally(subscription: any): void {
  if (!subscription) return;
  
  try {
    // Store the subscription data with timestamp
    const storageItem = {
      data: subscription,
      timestamp: Date.now()
    };
    localStorage.setItem('subscriptionData', JSON.stringify(storageItem));
    console.log("Subscription data stored in localStorage");
  } catch (e) {
    console.error("Error storing subscription data:", e);
  }
}

/**
 * Get subscription data from localStorage
 * @returns The stored subscription data if available and not expired, null otherwise
 */
export function getStoredSubscriptionData(): any {
  try {
    const storedData = localStorage.getItem('subscriptionData');
    if (!storedData) return null;
    
    const { data, timestamp } = JSON.parse(storedData);
    
    // Check if the data is expired (older than 30 minutes)
    const isExpired = Date.now() - timestamp > 30 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem('subscriptionData');
      return null;
    }
    
    return data;
  } catch (e) {
    console.error("Error retrieving stored subscription data:", e);
    return null;
  }
}
