
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
  const normalizedPlan = currentPlan.toLowerCase();
  
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
  const normalizedPlan = currentPlan.toLowerCase();
  
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
 * Clears all feature caches
 */
export function clearFeatureCaches(): void {
  featureCache.clear();
  projectLimitCache.clear();
}
