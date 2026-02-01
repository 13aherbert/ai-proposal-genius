
import {
  getAllUsers,
  getUserRoles,
  assignRole,
  removeRole,
  updateSubscriptionPlan,
  isAdmin,
  checkUserRole,
  ensureUserRole,
  assignRoleByEmail,
  updateUserSubscription,
  deleteUserAccount
} from './userService';

// Re-export types
export type { UserProfile, UserRole, UserRoleRecord } from './types';

export const adminService = {
  // User management methods
  getAllUsers,
  getUsers: getAllUsers, // Alias for backward compatibility
  getUserRoles,
  assignUserRole: assignRole, // Alias for backward compatibility
  removeUserRole: removeRole, // Alias for backward compatibility
  
  // Direct function exports
  assignRole,
  removeRole,
  
  // Role check methods
  isAdmin,
  checkUserRole,
  ensureUserRole,
  
  // Subscription management
  updateSubscriptionPlan,
  updateUserSubscription,
  
  // User-email operations
  assignRoleByEmail,
  
  // User account management
  deleteUserAccount
};
