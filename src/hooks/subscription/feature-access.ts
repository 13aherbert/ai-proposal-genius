
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
  if (!planType) return 'starter';
  
  const normalized = planType.toLowerCase().trim();
  
  // Map possible variants to standard types
  if (normalized.includes('enterprise')) return 'enterprise';
  if (normalized.includes('business')) return 'business';
  if (normalized.includes('growth')) return 'growth';
  if (normalized.includes('starter')) return 'starter';
  // Legacy mappings
  if (normalized.includes('pro')) return 'business';
  if (normalized.includes('basic')) return 'growth';
  if (normalized.includes('trial')) return 'starter';
  
  return 'starter'; // Default to starter if unknown
}

// Clear all feature and project limit caches
export function clearFeatureCaches() {
  featureCache.clear();
  projectLimitCache.clear();
  
  try {
    localStorage.removeItem('projectLimit');
    localStorage.removeItem('subscriptionData');
  } catch (e) {
    console.error("Error clearing local storage:", e);
  }
  
  if (typeof window !== 'undefined') {
    if (window.featureCache) window.featureCache.clear();
    if (window.projectLimitCache) window.projectLimitCache.clear();
  }
}

// Get the correct project limit for a plan
export function getProjectLimitForPlan(planType: string): number {
  const normalized = normalizePlanType(planType);
  
  switch (normalized) {
    case 'enterprise': return SUBSCRIPTION_PLAN_LIMITS.enterprise;
    case 'business': return SUBSCRIPTION_PLAN_LIMITS.business;
    case 'growth': return SUBSCRIPTION_PLAN_LIMITS.growth;
    case 'starter': return SUBSCRIPTION_PLAN_LIMITS.starter;
    default: return SUBSCRIPTION_PLAN_LIMITS.starter;
  }
}

// Get a safe project limit that respects the plan type
export function getSafeProjectLimit(planType: string, storedLimit: number): number {
  const normalized = normalizePlanType(planType);
  
  switch (normalized) {
    case 'enterprise': return SUBSCRIPTION_PLAN_LIMITS.enterprise;
    case 'business': return SUBSCRIPTION_PLAN_LIMITS.business;
    case 'growth': return SUBSCRIPTION_PLAN_LIMITS.growth;
    case 'starter': return SUBSCRIPTION_PLAN_LIMITS.starter;
    default: return storedLimit || 6;
  }
}

// Store subscription data in localStorage for faster access
export function storeSubscriptionDataLocally(subscription: any) {
  if (!subscription) return;
  
  try {
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
    
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

// Feature mapping based on plan type
const FEATURE_ACCESS_MAP: Record<FeatureName, string[]> = {
  rfp_summary: ['starter', 'growth', 'business', 'enterprise'],
  proposal_outline: ['starter', 'growth', 'business', 'enterprise'],
  proposal_draft: ['starter', 'growth', 'business', 'enterprise'],
  compiled_draft: ['growth', 'business', 'enterprise'],
  evaluation: ['business', 'enterprise'],
  auto_proposal_generation: ['business', 'enterprise'],
  data_export: ['growth', 'business', 'enterprise'],
  ai_editor: ['growth', 'business', 'enterprise'],
  team_collaboration: ['growth', 'business', 'enterprise'],
  advanced_analytics: ['business', 'enterprise'],
  api_access: ['business', 'enterprise'],
  white_labeling: ['enterprise'],
  priority_support: ['business', 'enterprise'],
  custom_templates: ['growth', 'business', 'enterprise'],
  opportunity_search: ['growth', 'business', 'enterprise'],
  design_studio: ['business', 'enterprise'],
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
  
  if (!(feature in FEATURE_ACCESS_MAP)) {
    return false;
  }
  
  return FEATURE_ACCESS_MAP[feature].includes(normalizedPlanType);
}

// Get a human-readable feature name for display
export function getFeatureName(
  feature: FeatureName,
  currentPlan: string
): string {
  const normalizedPlanType = normalizePlanType(currentPlan);
  
  const hasAccess = determineFeatureAccess(feature, normalizedPlanType);
  
  if (hasAccess) {
    return "Current Plan";
  }
  
  // Find the lowest tier plan that has access
  const accessPlans = FEATURE_ACCESS_MAP[feature];
  if (accessPlans.includes('starter')) return "Starter Plan";
  if (accessPlans.includes('growth')) return "Growth Plan";
  if (accessPlans.includes('business')) return "Business Plan";
  return "Enterprise Plan";
}
