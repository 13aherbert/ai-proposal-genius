
/**
 * Utilities for detecting and handling offline states
 */

import { isUserOnline, setUserOnlineStatus } from './error-detection';

// Time window for retry backoff (in ms)
const RETRY_BACKOFF_WINDOW = 5000;
const RETRY_MAX_ATTEMPTS = 3;

/**
 * Check if we should retry a failed request based on error type and retry count
 */
export function shouldRetryRequest(error: unknown, retryCount: number): boolean {
  // Don't retry too many times
  if (retryCount >= RETRY_MAX_ATTEMPTS) {
    return false;
  }
  
  // Retry network errors
  if (isNetworkRelatedError(error)) {
    return true;
  }
  
  // Don't retry auth errors (401, 403)
  if (isAuthError(error)) {
    return false;
  }
  
  // Retry server errors (500s)
  if (isServerError(error)) {
    return true;
  }
  
  return false;
}

/**
 * Calculate delay for the next retry attempt with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  return Math.min(
    RETRY_BACKOFF_WINDOW * Math.pow(2, retryCount),
    30000 // Max 30 seconds
  );
}

/**
 * Check if an error is related to authentication
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  
  return (
    errorString.includes('unauthorized') ||
    errorString.includes('forbidden') ||
    errorString.includes('401') ||
    errorString.includes('403') ||
    errorString.includes('not authenticated') ||
    errorString.includes('invalid token') ||
    errorString.includes('expired token')
  );
}

/**
 * Check if an error is server-related (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  
  return (
    errorString.includes('500') ||
    errorString.includes('502') ||
    errorString.includes('503') ||
    errorString.includes('504') ||
    errorString.includes('internal server error') ||
    errorString.includes('bad gateway') ||
    errorString.includes('service unavailable') ||
    errorString.includes('gateway timeout')
  );
}

/**
 * Check if this is a network related error
 */
export function isNetworkRelatedError(error: unknown): boolean {
  if (!error) return false;
  
  // Check with the existing network error detection
  if (typeof isNetworkError === 'function') {
    return isNetworkError(error);
  }
  
  const errorString = String(error).toLowerCase();
  
  return (
    errorString.includes('network') ||
    errorString.includes('offline') ||
    errorString.includes('internet') ||
    errorString.includes('connection') ||
    errorString.includes('unreachable') ||
    errorString.includes('timeout') ||
    errorString.includes('abort')
  );
}

/**
 * Broadcast a network status change event
 */
export function broadcastNetworkStatus(isOnline: boolean): void {
  // Update cached status
  setUserOnlineStatus(isOnline);
  
  // Dispatch event for components to listen
  window.dispatchEvent(
    new CustomEvent('networkStatusChange', { detail: { isOnline } })
  );
  
  console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
}

/**
 * Setup network status listeners
 */
export function setupNetworkListeners(callback?: (isOnline: boolean) => void): () => void {
  const handleOnline = () => {
    broadcastNetworkStatus(true);
    if (callback) callback(true);
  };
  
  const handleOffline = () => {
    broadcastNetworkStatus(false);
    if (callback) callback(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Initial check
  if (callback) {
    callback(navigator.onLine);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Hook up to existing isNetworkError function if available
 */
let isNetworkError: ((error: unknown) => boolean) | undefined;
try {
  isNetworkError = require('./error-detection').isNetworkError;
} catch (e) {
  console.warn('Could not import isNetworkError, using fallback');
}
