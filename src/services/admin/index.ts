
import { UserRole, UserProfile, UserRoleRecord, BetaInvitation } from './types';
import { checkUserRole, isAdmin, assignRole, assignRoleByEmail, removeRole, ensureUserRole, isBetaTester } from './roleService';
import { getAllUsers, updateSubscriptionPlan } from './userService';
import { 
  createBetaInvitation, 
  getBetaInvitations, 
  cancelBetaInvitation,
  verifyBetaInvitation,
  acceptBetaInvitation
} from './betaService';

// Re-export all types
export type { UserRole, UserProfile, UserRoleRecord, BetaInvitation };

// Create a single adminService object with all methods for backward compatibility
export const adminService = {
  // Role management
  checkUserRole,
  isAdmin,
  isBetaTester,
  assignRole,
  assignRoleByEmail,
  removeRole,
  ensureUserRole,
  
  // User management
  getAllUsers,
  updateSubscriptionPlan,
  
  // Beta invitation management
  createBetaInvitation,
  getBetaInvitations,
  cancelBetaInvitation,
  verifyBetaInvitation,
  acceptBetaInvitation
};

// Also re-export individual functions for direct imports
export {
  checkUserRole,
  isAdmin,
  isBetaTester,
  assignRole,
  assignRoleByEmail,
  removeRole,
  ensureUserRole
};
