
import { 
  getBetaInvitations, 
  createBetaInvitation, 
  cancelBetaInvitation, 
  verifyBetaInvitation,
  acceptBetaInvitation,
  resendInvitationEmail,
  getBetaRequests,
  processBetaRequest
} from './betaService';

import {
  getAllUsers,
  getUserRoles,
  assignRole,
  removeRole,
  updateSubscriptionPlan,
  isAdmin,
  isBetaTester,
  checkUserRole,
  ensureUserRole,
  assignRoleByEmail,
  updateUserSubscription,
  deleteUserAccount
} from './userService';

// Re-export types
export type { BetaInvitation, UserProfile, UserRole, UserRoleRecord } from './types';

export const adminService = {
  // Beta invitation methods
  getBetaInvitations,
  createBetaInvitation,
  cancelBetaInvitation,
  verifyBetaInvitation,
  acceptBetaInvitation,
  resendInvitationEmail,
  
  // Beta request methods
  getBetaRequests,
  processBetaRequest,
  
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
  isBetaTester,
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
