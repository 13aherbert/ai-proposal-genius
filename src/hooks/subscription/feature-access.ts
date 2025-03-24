
import { FeatureName } from "./subscription-features-types";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";

// Create a cache for faster feature access checks
export const featureCache = new Map<string, boolean>();

// Create a cache for project limit checks
export const projectLimitCache = new Map<string, number>();

// Initialize global caches for faster access across components
if (typeof window !== 'undefined') {
  if (!window.featureCache) {
    window.featureCache = featureCache;
  }
  
  if (!window.projectLimitCache) {
    window.projectLimitCache = projectLimitCache;
  }
}

// Normalize plan type to lowercase for consistent comparison
export function normalizePlanType(planType: string | undefined): string {
  return (planType || 'trial').toLowerCase().trim();
}

// Clear all feature and project limit caches
export function clearFeatureCaches() {
  featureCache.clear();
  projectLimitCache.clear();
  
  // Also clear localStorage caches
  try {
    localStorage.removeItem('projectLimit');
    localStorage.removeItem('subscriptionData');
  } catch (e) {
    console.error("Error clearing local storage:", e);
  }
  
  // Clear window caches
  if (typeof window !== 'undefined') {
    if (window.featureCache) {
      window.featureCache.clear();
    }
    
    if (window.projectLimitCache) {
      window.projectLimitCache.clear();
    }
  }
}

// Get the correct project limit for a plan
export function getProjectLimitForPlan(planType: string): number {
  planType = planType.toLowerCase().trim();
  
  if (planType === 'pro') return SUBSCRIPTION_PLAN_LIMITS.pro;
  if (planType === 'starter' || planType === 'standard') return SUBSCRIPTION_PLAN_LIMITS.starter;
  return SUBSCRIPTION_PLAN_LIMITS.trial;
}

// Get a safe project limit that respects the plan type
export function getSafeProjectLimit(planType: string, storedLimit: number): number {
  planType = planType.toLowerCase().trim();
  
  // Override with correct limits
  if (planType === 'starter' || planType === 'standard') return SUBSCRIPTION_PLAN_LIMITS.starter;
  if (planType === 'pro') return SUBSCRIPTION_PLAN_LIMITS.pro;
  if (planType === 'trial') return SUBSCRIPTION_PLAN_LIMITS.trial;
  
  // If plan type doesn't match known types, use provided limit with a fallback
  return storedLimit || 3;
}

// Store subscription data in localStorage for faster access
export function storeSubscriptionDataLocally(subscription: any) {
  if (!subscription) return;
  
  try {
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
    
    // Also store just the project limit for even faster access
    localStorage.setItem('projectLimit', String(subscription.project_limit));
  } catch (e) {
    console.error("Error storing subscription data locally:", e);
  }
}

// Get subscription data from localStorage
export function getStoredSubscriptionData(): any | null {
  try {
    const data = localStorage.getItem('subscriptionData');
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (e) {
    console.error("Error retrieving subscription data from localStorage:", e);
    return null;
  }
}

// Feature mapping based on plan type
const FEATURE_ACCESS_MAP: Record<FeatureName, string[]> = {
  rfp_summary: ['trial', 'starter', 'standard', 'pro'],  // All plans have access
  proposal_outline: ['trial', 'starter', 'standard', 'pro'],  // All plans have access
  proposal_draft: ['trial', 'starter', 'standard', 'pro'],  // All plans have access
  compiled_draft: ['pro'],  // Only pro has access
  evaluation: ['pro'],  // Only pro has access
  data_export: ['pro'],  // Only pro has access
  ai_editor: ['starter', 'standard', 'pro'],  // Only starter and pro have access
  team_collaboration: ['pro'],  // Only pro has access
  advanced_analytics: ['pro'],  // Only pro has access
  api_access: ['pro'],  // Only pro has access
  white_labeling: ['pro'],  // Only pro has access
  priority_support: ['pro'],  // Only pro has access
  custom_templates: ['pro']  // Only pro has access
};

// Check if user has a specific plan type based on subscription data
export function isUserOfPlanType(planType: string): boolean {
  try {
    const subscriptionData = getStoredSubscriptionData();
    if (subscriptionData && subscriptionData.plan_type) {
      // Check for both explicit match and starter/standard equivalence
      if (planType.toLowerCase() === 'starter' || planType.toLowerCase() === 'standard') {
        const normalizedPlanType = subscriptionData.plan_type.toLowerCase();
        return normalizedPlanType === 'starter' || normalizedPlanType === 'standard';
      }
      return subscriptionData.plan_type.toLowerCase() === planType.toLowerCase();
    }
    return false;
  } catch (e) {
    console.error(`Error checking if user has plan type ${planType}:`, e);
    return false;
  }
}

// Add a new function to check if a user is a starter user
export function isStarterUser(): boolean {
  return isUserOfPlanType('starter') || isUserOfPlanType('standard');
}

// Determine if a user has access to a feature based on their plan
export function determineFeatureAccess(
  feature: FeatureName,
  planType: string
): boolean {
  planType = planType.toLowerCase().trim();
  
  // Check if this feature exists in our mapping
  if (!(feature in FEATURE_ACCESS_MAP)) {
    return false;
  }
  
  // For compatibility, treat 'standard' as 'starter'
  if (planType === 'standard') {
    planType = 'starter';
  }
  
  // Check if the user's plan is in the list of plans that have access to this feature
  return FEATURE_ACCESS_MAP[feature].includes(planType);
}

// Get a human-readable feature name for display
export function getFeatureName(
  feature: FeatureName,
  currentPlan: string
): string {
  currentPlan = currentPlan.toLowerCase().trim();
  
  // Check if user has access to this feature
  const hasAccess = determineFeatureAccess(feature, currentPlan);
  
  // Return plan name that has access to this feature
  if (hasAccess) {
    return "Current Plan";
  }
  
  // If not, find the lowest tier plan that has access
  if (FEATURE_ACCESS_MAP[feature].includes('trial')) {
    return "Trial Plan";
  } else if (FEATURE_ACCESS_MAP[feature].includes('starter')) {
    return "Starter Plan";
  } else {
    return "Pro Plan";
  }
}
