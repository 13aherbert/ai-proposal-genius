
/**
 * TokenManager utility
 * 
 * Centralizes authentication token management with consistent methods
 * for storing, retrieving, and validating tokens.
 */

const TOKEN_KEY = 'userToken';
const ROLES_KEY = 'userRoles';
const SUBSCRIPTION_KEY = 'subscriptionData';

// Basic token validation - checks if token exists and has expected format
const isTokenValid = (token: string): boolean => {
  if (!token || typeof token !== 'string' || token.length < 10) {
    return false;
  }
  
  // Basic JWT format validation (header.payload.signature)
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
};

/**
 * Get the stored authentication token
 */
export const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && isTokenValid(token) ? token : null;
  } catch (error) {
    console.error('Error retrieving auth token from storage:', error);
    return null;
  }
};

/**
 * Store the authentication token
 */
export const setAuthToken = (token: string): boolean => {
  if (!token || !isTokenValid(token)) {
    console.warn('Attempted to store invalid token');
    return false;
  }
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

/**
 * Remove the authentication token
 */
export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
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
 * Clear all authentication related data
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};
