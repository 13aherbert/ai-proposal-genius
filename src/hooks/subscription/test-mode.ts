
/**
 * Test mode functions for subscription features
 */

/**
 * Checks if test mode is enabled
 */
export function isTestModeEnabled(): boolean {
  return localStorage.getItem('test_mode') === 'true';
}

/**
 * Gets the current test plan
 */
export function getTestPlan(): string {
  return localStorage.getItem('test_plan') || 'trial';
}

/**
 * Enables test mode with specified plan
 */
export function enableTestMode(planType: 'trial' | 'starter' | 'pro' = 'trial'): void {
  localStorage.setItem('test_mode', 'true');
  localStorage.setItem('test_plan', planType);
  console.log(`Test mode enabled with plan: ${planType}`);
}

/**
 * Disables test mode
 */
export function disableTestMode(): void {
  localStorage.removeItem('test_mode');
  localStorage.removeItem('test_plan');
  console.log('Test mode disabled');
}

/**
 * Gets the test project limit from localStorage
 */
export function getTestProjectLimit(): number {
  return parseInt(localStorage.getItem('test_project_limit') || '3');
}
