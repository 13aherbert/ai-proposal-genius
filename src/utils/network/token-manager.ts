
/**
 * TokenManager utility
 * 
 * SECURITY UPDATE: Authentication tokens are no longer stored in localStorage.
 * Supabase's built-in session management handles token storage securely.
 * 
 * This module now only manages cached non-sensitive data for UI purposes.
 * All authentication decisions should use supabase.auth.getSession() instead.
 */

const ROLES_KEY = 'userRoles';
const SUBSCRIPTION_KEY = 'subscriptionData';

/**
 * @deprecated Use supabase.auth.getSession() instead
 * Auth tokens should not be stored in localStorage for security reasons.
 * This function is kept for backwards compatibility but always returns null.
 */
export const getAuthToken = (): string | null => {
  console.warn('getAuthToken is deprecated. Use supabase.auth.getSession() for authentication.');
  return null;
};

/**
 * @deprecated Auth tokens should not be stored in localStorage
 * Use Supabase's built-in session management instead.
 * This function is kept for backwards compatibility but does nothing.
 */
export const setAuthToken = (_token: string): boolean => {
  console.warn('setAuthToken is deprecated. Supabase handles token storage securely.');
  return false;
};

/**
 * @deprecated Auth tokens are now managed by Supabase
 * This function is kept for backwards compatibility but does nothing.
 */
export const removeAuthToken = (): void => {
  console.warn('removeAuthToken is deprecated. Use supabase.auth.signOut() instead.');
};

/**
 * Store user roles in localStorage
 */
export const setUserRoles = (roles: Record<string, any>): boolean => {
  if (!roles || typeof roles !== 'object') {
    return false;
  }
  
  try {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    return true;
  } catch (error) {
    console.error('Error storing user roles:', error);
    return false;
  }
};

/**
 * Get user roles from localStorage
 */
export const getUserRoles = (): Record<string, any> | null => {
  try {
    const rolesString = localStorage.getItem(ROLES_KEY);
    return rolesString ? JSON.parse(rolesString) : null;
  } catch (error) {
    console.error('Error retrieving user roles from storage:', error);
    return null;
  }
};

/**
 * Store subscription data in localStorage
 */
export const setSubscriptionData = (data: Record<string, any>): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  try {
    // Add timestamp for freshness check
    const dataWithTimestamp = {
      ...data,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(dataWithTimestamp));
    return true;
  } catch (error) {
    console.error('Error storing subscription data:', error);
    return false;
  }
};

/**
 * Get subscription data from localStorage
 */
export const getSubscriptionData = (): Record<string, any> | null => {
  try {
    const dataString = localStorage.getItem(SUBSCRIPTION_KEY);
    return dataString ? JSON.parse(dataString) : null;
  } catch (error) {
    console.error('Error retrieving subscription data from storage:', error);
    return null;
  }
};

/**
 * Clear all cached data (not auth tokens - those are managed by Supabase)
 * SECURITY: Only clears non-sensitive cached data for UI purposes
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
