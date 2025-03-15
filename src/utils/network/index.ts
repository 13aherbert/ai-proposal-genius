
// Re-export token manager functions for cleaner imports
export * from './token-manager';
export * from './retry';
export * from './error-detection';
export * from './rate-limit';

// Add types exports
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: any;
  status?: number;
}

// Subscription data management
const STORAGE_KEY = 'subscription_data';

export function getSubscriptionData(): any {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting subscription data from localStorage:', error);
    return null;
  }
}

export function setSubscriptionData(data: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting subscription data in localStorage:', error);
  }
}

export function clearSubscriptionData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing subscription data from localStorage:', error);
  }
}
