
import { 
  getBetaInvitations, 
  createBetaInvitation, 
  cancelBetaInvitation, 
  verifyBetaInvitation,
  acceptBetaInvitation,
  resendInvitationEmail
} from './betaService';

import {
  getAllUsers as getUsers,
  getUserRoles,
  assignUserRole,
  removeUserRole,
  updateSubscriptionPlan,
  isAdmin,
  isBetaTester,
  checkUserRole,
  ensureUserRole,
  assignRole,
  removeRole,
  assignRoleByEmail
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
  
  // User management methods
  getUsers,
  getUserRoles,
  assignUserRole,
  removeUserRole,
  
  // Role check methods
  isAdmin,
  isBetaTester,
  checkUserRole,
  ensureUserRole,
  
  // Higher-level user management methods
  assignRole,
  removeRole,
  updateSubscriptionPlan,
  assignRoleByEmail,
  
  // Alias for getAllUsers to maintain backward compatibility
  getAllUsers: getUsers
};
