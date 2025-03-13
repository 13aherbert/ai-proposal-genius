
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";

// Constants
const TEST_MODE_KEY = 'test_mode_enabled';
const TEST_PLAN_KEY = 'test_plan_type';
const TEST_PROJECT_LIMIT_KEY = 'test_project_limit';

/**
 * Check if test mode is enabled
 */
export function isTestModeEnabled(): boolean {
  try {
    return localStorage.getItem(TEST_MODE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Get the test plan type
 */
export function getTestPlan(): string {
  try {
    return localStorage.getItem(TEST_PLAN_KEY) || 'trial';
  } catch (e) {
    return 'trial';
  }
}

/**
 * Get the test project limit
 */
export function getTestProjectLimit(): number {
  try {
    const storedLimit = localStorage.getItem(TEST_PROJECT_LIMIT_KEY);
    if (storedLimit) {
      return parseInt(storedLimit, 10);
    }
    
    // If no stored limit, return the default for the current test plan
    const testPlan = getTestPlan();
    if (testPlan === 'pro') return SUBSCRIPTION_PLAN_LIMITS.pro;
    if (testPlan === 'starter') return SUBSCRIPTION_PLAN_LIMITS.starter;
    return SUBSCRIPTION_PLAN_LIMITS.trial;
  } catch (e) {
    return 3; // Default to trial limit
  }
}

/**
 * Enable test mode with a specific plan type
 */
export function enableTestMode(planType: 'trial' | 'starter' | 'pro' = 'trial'): void {
  try {
    localStorage.setItem(TEST_MODE_KEY, 'true');
    localStorage.setItem(TEST_PLAN_KEY, planType);
    
    // Set the corresponding project limit
    let projectLimit = SUBSCRIPTION_PLAN_LIMITS.trial;
    if (planType === 'starter') projectLimit = SUBSCRIPTION_PLAN_LIMITS.starter;
    if (planType === 'pro') projectLimit = SUBSCRIPTION_PLAN_LIMITS.pro;
    
    localStorage.setItem(TEST_PROJECT_LIMIT_KEY, String(projectLimit));
    
    console.log(`Test mode enabled with ${planType} plan and ${projectLimit} project limit`);
  } catch (e) {
    console.error('Failed to enable test mode:', e);
  }
}

/**
 * Disable test mode
 */
export function disableTestMode(): void {
  try {
    localStorage.removeItem(TEST_MODE_KEY);
    localStorage.removeItem(TEST_PLAN_KEY);
    localStorage.removeItem(TEST_PROJECT_LIMIT_KEY);
    console.log('Test mode disabled');
  } catch (e) {
    console.error('Failed to disable test mode:', e);
  }
}
