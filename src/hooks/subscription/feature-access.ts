
import { FeatureName } from "./subscription-features-types";

// Cache for feature availability to avoid recalculations
export const featureCache = new Map<string, boolean>();
export const projectLimitCache = new Map<string, number>();

/**
 * Determines if a feature is available for a given plan
 */
export function determineFeatureAccess(
  feature: FeatureName, 
  currentPlan: string
): boolean {
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = (currentPlan || '').toLowerCase();
  
  // Pro tier has access to all features
  if (normalizedPlan === 'pro') {
    return true;
  }
  // Starter tier has access to basic features
  else if (normalizedPlan === 'starter') {
    return ['rfp_summary', 'proposal_outline', 'proposal_draft', 'data_export'].includes(feature);
  }
  // Trial tier has access to RFP summary, proposal outline, and proposal draft
  else if (normalizedPlan === 'trial') {
    return ['rfp_summary', 'proposal_outline', 'proposal_draft'].includes(feature);
  }

  return false;
}

/**
 * Gets human-readable feature name for a given plan
 */
export function getFeatureName(feature: FeatureName, currentPlan: string): string {
  // Normalize the plan type to lowercase for consistent comparison
  const normalizedPlan = (currentPlan || '').toLowerCase();
  
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
  const normalizedPlan = (planType || '').toLowerCase();
  
  if (normalizedPlan === 'pro') {
    return 30;
  } else if (normalizedPlan === 'starter') {
    return 10;  // Starter plans always get 10 projects
  } else {
    return 3; // Trial or unknown plan
  }
}

/**
 * Safely gets project limit with fallback
 * This ensures we always have a valid project limit even if subscription data is loading
 */
export function getSafeProjectLimit(planType: string | undefined, storedLimit: number | undefined): number {
  // If we don't have either data point, use trial limit as default
  if (!planType && !storedLimit) {
    return 3; // Trial default
  }
  
  // If we have a plan type, calculate the correct limit
  if (planType) {
    const normalizedPlan = planType.toLowerCase();
    
    // For starter plans, always return 10 regardless of stored limit
    if (normalizedPlan === 'starter') {
      return 10;
    }
    
    // For other plans, calculate based on plan type
    return getProjectLimitForPlan(normalizedPlan);
  }
  
  // If we only have storedLimit, use it (but correct it for starter plans)
  if (storedLimit !== undefined) {
    // If stored limit is 3 but we know starter plans should have 10, correct it
    if (storedLimit === 3) {
      // We can't determine if this is actually a starter plan without the plan type
      // so we'll return 3 to be safe
      return 3;
    }
    return storedLimit;
  }
  
  // Final fallback
  return 3;
}

/**
 * Clears all feature caches
 */
export function clearFeatureCaches(): void {
  console.log("Clearing feature and project limit caches");
  featureCache.clear();
  projectLimitCache.clear();
}
