
// Re-export all network utilities from a central index file
export { isNetworkError, getNetworkErrorMessage, isUserOnline, setUserOnlineStatus } from './error-detection';
export { withRetry } from './retry';
export { withRateLimit, withRateLimitByKey } from './rate-limit';
export type { EdgeFunctionResponse } from './types';

// Export token manager functions
export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserRoles,
  setUserRoles,
  getSubscriptionData,
  setSubscriptionData,
  clearAuthData
} from './token-manager';
