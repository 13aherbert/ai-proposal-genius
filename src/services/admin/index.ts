
import { UserRole, UserProfile, UserRoleRecord, BetaInvitation } from './types';
import { checkUserRole, isAdmin, assignRole, removeRole, ensureUserRole } from './roleService';
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
  assignRole,
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
