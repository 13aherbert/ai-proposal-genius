
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

// The specific user ID that should always have starter plan
const STARTER_USER_ID = "315f2366-4b3e-4c20-83bf-e59d5b80ad4c";

/**
 * Checks if current user is the specific starter user
 */
export function isStarterUser(): boolean {
  // First check if localStorage is available
  try {
    const storedAuthData = localStorage.getItem('supabase.auth.token');
    if (storedAuthData) {
      const parsedData = JSON.parse(storedAuthData);
      const userId = parsedData?.currentSession?.user?.id;
      if (userId && userId === STARTER_USER_ID) {
        console.log("STARTER USER detected from localStorage");
        return true;
      }
    }
  } catch (e) {
    console.error("Error checking localStorage for auth data:", e);
  }
  
  // Then try window.auth object if available
  if (typeof window !== 'undefined' && window.auth && window.auth.user) {
    if (window.auth.user.id === STARTER_USER_ID) {
      console.log("STARTER USER detected from window.auth");
      return true;
    }
  }
  
  // Finally check sessionStorage
  try {
    const sessionData = sessionStorage.getItem('supabase.auth.token');
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      const userId = parsedData?.currentSession?.user?.id;
      if (userId && userId === STARTER_USER_ID) {
        console.log("STARTER USER detected from sessionStorage");
        return true;
      }
    }
  } catch (e) {
    console.error("Error checking sessionStorage for auth data:", e);
  }
  
  return false;
}

/**
 * Normalizes plan type strings for consistent comparison
 */
export function normalizePlanType(planType: string | null | undefined): string {
  // If this is the starter user, always return 'starter'
  if (isStarterUser()) {
    return 'starter';
  }
  
  // Handle null/undefined cases
  if (!planType) return 'trial';
  
  // Convert to lowercase for consistent comparison
  const normalized = planType.toLowerCase().trim();
  
  // Validate against known plan types
  if (['trial', 'starter', 'pro'].includes(normalized)) {
    return normalized;
  }
  
  // Default to trial for unknown plans
  console.log(`Unknown plan type "${planType}" normalized to "trial"`);
  return 'trial';
}

/**
 * Determines if a feature is available for a given plan
 */
export function determineFeatureAccess(
  feature: FeatureName, 
  currentPlan: string
): boolean {
  // If this is the starter user, always use 'starter' as the plan
  if (isStarterUser()) {
    currentPlan = 'starter';
  }
  
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
  // Special case for the specific user who should have starter plan
  if (isStarterUser()) {
    console.log("CRITICAL USER DETECTED - Forcing starter plan limit");
    return SUBSCRIPTION_PLAN_LIMITS.starter; // Force 10 projects
  }
  
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = normalizePlanType(planType);
  
  // Generate consistent console logging for debugging
  console.log(`Getting project limit for plan type: "${normalizedPlan}"`);
  
  // Check window cache first for performance
  if (window.projectLimitCache && window.projectLimitCache.has(normalizedPlan)) {
    const cachedLimit = window.projectLimitCache.get(normalizedPlan);
    console.log(`Using cached project limit for ${normalizedPlan}: ${cachedLimit}`);
    return cachedLimit as number;
  }
  
  let limit: number;
  
  // CRITICAL: Enforce exact limits based on plan type
  if (normalizedPlan === 'pro') {
    limit = SUBSCRIPTION_PLAN_LIMITS.pro; // 30
  } else if (normalizedPlan === 'starter') {
    limit = SUBSCRIPTION_PLAN_LIMITS.starter; // 10
    console.log(`IMPORTANT: Enforcing starter plan limit of ${limit} projects`);
  } else {
    limit = SUBSCRIPTION_PLAN_LIMITS.trial; // 3
  }
  
  console.log(`Plan "${normalizedPlan}" has project limit: ${limit}`);
  
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
  // Special case for the specific user who should have starter plan
  if (isStarterUser()) {
    console.log("CRITICAL USER DETECTED - Forcing starter plan limit in getSafeProjectLimit");
    return SUBSCRIPTION_PLAN_LIMITS.starter; // Force 10 projects
  }
  
  console.log(`Getting safe project limit for: planType=${planType}, storedLimit=${storedLimit}`);
  
  // If we don't have either data point, use trial limit as default
  if (!planType && storedLimit === undefined) {
    console.log(`No plan or stored limit, returning trial limit: ${SUBSCRIPTION_PLAN_LIMITS.trial}`);
    return SUBSCRIPTION_PLAN_LIMITS.trial;
  }
  
  // If we have a plan type, calculate the correct limit
  if (planType) {
    const normalizedPlan = normalizePlanType(planType);
    console.log(`Normalized plan: ${normalizedPlan}`);
    
    // CRITICAL: Force correct limits based on plan types
    if (normalizedPlan === 'starter') {
      console.log(`Starter plan detected, ENFORCING ${SUBSCRIPTION_PLAN_LIMITS.starter} projects limit`);
      return SUBSCRIPTION_PLAN_LIMITS.starter; // Force to 10 for all starter plans
    } else if (normalizedPlan === 'pro') {
      return SUBSCRIPTION_PLAN_LIMITS.pro;
    } else if (normalizedPlan === 'trial') {
      return SUBSCRIPTION_PLAN_LIMITS.trial;
    }
    
    // Fallback to stored limit if plan doesn't match known types
    console.log(`Unknown plan type, using stored limit: ${storedLimit}`);
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
    console.log("Subscription data stored in localStorage:", subscription);
    
    // CRITICAL: Special case - if this is the starter user, make sure we have a starter subscription
    if (isStarterUser()) {
      // Ensure it's a starter subscription
      if (subscription.plan_type !== 'starter' || subscription.project_limit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
        const correctedSub = {
          ...subscription,
          plan_type: 'starter',
          project_limit: SUBSCRIPTION_PLAN_LIMITS.starter
        };
        
        localStorage.setItem('subscriptionData', JSON.stringify({
          data: correctedSub,
          timestamp: Date.now()
        }));
        console.log("CRITICAL: Corrected subscription data for starter user:", correctedSub);
      }
    }
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
    if (!storedData) {
      console.log("No subscription data found in localStorage");
      return null;
    }
    
    const { data, timestamp } = JSON.parse(storedData);
    
    // Check if the data is expired (older than 30 minutes)
    const isExpired = Date.now() - timestamp > 30 * 60 * 1000;
    if (isExpired) {
      console.log("Stored subscription data is expired, removing");
      localStorage.removeItem('subscriptionData');
      return null;
    }
    
    // CRITICAL: Special case - if this is the starter user, make sure we have a starter subscription
    if (isStarterUser()) {
      // Ensure it's a starter subscription
      if (data.plan_type !== 'starter' || data.project_limit !== SUBSCRIPTION_PLAN_LIMITS.starter) {
        const correctedData = {
          ...data,
          plan_type: 'starter',
          project_limit: SUBSCRIPTION_PLAN_LIMITS.starter
        };
        console.log("CRITICAL: Corrected stored subscription data for starter user:", correctedData);
        return correctedData;
      }
    }
    
    console.log("Retrieved valid stored subscription data:", data);
    return data;
  } catch (e) {
    console.error("Error retrieving stored subscription data:", e);
    return null;
  }
}
