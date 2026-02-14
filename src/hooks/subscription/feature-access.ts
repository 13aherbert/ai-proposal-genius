
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
  if (!planType) return 'trial';
  
  // Trim, lowercase, and standardize plan types
  const normalized = planType.toLowerCase().trim();
  
  // Map possible variants to standard types
  if (normalized.includes('starter')) return 'starter';
  if (normalized.includes('pro')) return 'pro';
  
  return 'trial'; // Default to trial if unknown
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
  const normalizedPlanType = normalizePlanType(planType);
  
  console.log(`Getting project limit for normalized plan type: ${normalizedPlanType}`);
  
  if (normalizedPlanType === 'pro') {
    console.log(`Returning pro limit: ${SUBSCRIPTION_PLAN_LIMITS.pro}`);
    return SUBSCRIPTION_PLAN_LIMITS.pro;
  }
  
  if (normalizedPlanType === 'starter') {
    console.log(`Returning starter limit: ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
    return SUBSCRIPTION_PLAN_LIMITS.starter;
  }
  
  console.log(`Returning starter limit: ${SUBSCRIPTION_PLAN_LIMITS.starter}`);
  return SUBSCRIPTION_PLAN_LIMITS.starter;
}

// Get a safe project limit that respects the plan type
export function getSafeProjectLimit(planType: string, storedLimit: number): number {
  const normalizedPlanType = normalizePlanType(planType);
  
  // Override with correct limits
  if (normalizedPlanType === 'starter') return SUBSCRIPTION_PLAN_LIMITS.starter;
  if (normalizedPlanType === 'basic') return SUBSCRIPTION_PLAN_LIMITS.basic;
  if (normalizedPlanType === 'pro') return SUBSCRIPTION_PLAN_LIMITS.pro;
  
  // If plan type doesn't match known types, use provided limit with a fallback
  return storedLimit || 3;
}

// Store subscription data in localStorage for faster access
export function storeSubscriptionDataLocally(subscription: any) {
  if (!subscription) return;
  
  try {
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
    
    // Also store just the project limit for even faster access
    const planType = normalizePlanType(subscription.plan_type);
    const safeLimit = getSafeProjectLimit(planType, subscription.project_limit);
    localStorage.setItem('projectLimit', String(safeLimit));
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

// Check if trial has expired (2 weeks after signup)
export function isTrialExpired(user: any): boolean {
  if (!user) return false;
  
  try {
    // If user isn't on trial plan, return false
    const subscriptionData = getStoredSubscriptionData();
    if (subscriptionData && subscriptionData.plan_type?.toLowerCase() !== 'trial') {
      return false;
    }
    
    const createdAt = new Date(user.created_at);
    const now = new Date();
    
    // Calculate time difference in milliseconds
    const timeDiff = now.getTime() - createdAt.getTime();
    
    // Convert to days (2 weeks = 14 days)
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    console.log(`Trial check: User created ${daysDiff.toFixed(1)} days ago, expires after 14 days`);
    
    return daysDiff > 14;
  } catch (e) {
    console.error("Error checking trial expiration:", e);
    return false;
  }
}

// Feature mapping based on plan type
const FEATURE_ACCESS_MAP: Record<FeatureName, string[]> = {
  rfp_summary: ['trial', 'starter', 'pro'],  // All plans have access
  proposal_outline: ['trial', 'starter', 'pro'],  // All plans have access
  proposal_draft: ['trial', 'starter', 'pro'],  // All plans have access
  compiled_draft: ['pro'],  // Only pro has access
  evaluation: ['pro'],  // Only pro has access
  auto_proposal_generation: ['pro'],  // Only pro has access - advanced feature
  data_export: ['pro'],  // Only pro has access
  ai_editor: ['starter', 'pro'],  // Only starter and pro have access
  team_collaboration: ['pro'],  // Only pro has access
  advanced_analytics: ['pro'],  // Only pro has access
  api_access: ['pro'],  // Only pro has access
  white_labeling: ['pro'],  // Only pro has access
  priority_support: ['pro'],  // Only pro has access
  custom_templates: ['pro'],  // Only pro has access
  opportunity_search: ['pro'],  // Only pro has access - RFP opportunity search
};

// Check if user has a specific plan type based on subscription data
export function isUserOfPlanType(planType: string): boolean {
  try {
    const subscriptionData = getStoredSubscriptionData();
    if (subscriptionData && subscriptionData.plan_type) {
      return normalizePlanType(subscriptionData.plan_type) === normalizePlanType(planType);
    }
    return false;
  } catch (e) {
    console.error(`Error checking if user has plan type ${planType}:`, e);
    return false;
  }
}

// Add a new function to check if a user is a starter user
export function isStarterUser(): boolean {
  return isUserOfPlanType('starter');
}

// Determine if a user has access to a feature based on their plan
export function determineFeatureAccess(
  feature: FeatureName,
  planType: string
): boolean {
  const normalizedPlanType = normalizePlanType(planType);
  
  // Check if this feature exists in our mapping
  if (!(feature in FEATURE_ACCESS_MAP)) {
    return false;
  }
  
  // Check if the user's plan is in the list of plans that have access to this feature
  return FEATURE_ACCESS_MAP[feature].includes(normalizedPlanType);
}

// Get a human-readable feature name for display
export function getFeatureName(
  feature: FeatureName,
  currentPlan: string
): string {
  const normalizedPlanType = normalizePlanType(currentPlan);
  
  // Check if user has access to this feature
  const hasAccess = determineFeatureAccess(feature, normalizedPlanType);
  
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
