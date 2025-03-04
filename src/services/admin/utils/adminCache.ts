
/**
 * Utility for caching admin status to reduce API calls
 */

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache for admin status to avoid repeated calls
// Increase cache duration to 5 minutes to reduce API calls
interface AdminStatusCache {
  status: boolean | null;
  timestamp: number;
}

let adminStatusCache: AdminStatusCache = { 
  status: null, 
  timestamp: 0 
};

export function getAdminStatusFromCache(): boolean | null {
  const now = Date.now();
  if (adminStatusCache.status !== null && (now - adminStatusCache.timestamp) < CACHE_DURATION) {
    return adminStatusCache.status;
  }
  return null;
}

export function setAdminStatusCache(status: boolean): void {
  adminStatusCache = { 
    status, 
    timestamp: Date.now() 
  };
}
