
/**
 * Role Service
 * 
 * This service provides functions to check and manage user roles.
 * It is implemented to avoid row-level security recursion issues by using
 * direct queries and RPC functions where necessary.
 */

import { checkUserRole, isAdmin, isSystemAdmin } from './utils/roleCheckers';
import { assignRole, removeRole, ensureUserRole, assignRoleByEmail } from './utils/roleManagement';
import type { UserRole } from './types';

// Re-export all utilities and types
export {
  checkUserRole,
  isAdmin,
  isSystemAdmin,
  assignRole,
  assignRoleByEmail,
  removeRole,
  ensureUserRole,
};

// Re-export type
export type { UserRole };

/**
 * Checks if the current user has the system_admin role
 * This specific implementation uses a direct RPC call to avoid RLS recursion issues
 */
export const isSystemAdminRole = isSystemAdmin;
