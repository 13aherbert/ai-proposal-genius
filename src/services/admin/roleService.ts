
/**
 * Role Service
 * 
 * This service provides functions to check and manage user roles.
 * It is implemented to avoid row-level security recursion issues by using
 * direct queries and RPC functions where necessary.
 */

import { checkUserRole, isAdmin } from './utils/roleCheckers';
import { assignRole, removeRole, ensureUserRole, assignRoleByEmail } from './utils/roleManagement';
import { UserRole } from './types';

// Re-export all utilities
export {
  checkUserRole,
  isAdmin,
  assignRole,
  assignRoleByEmail,
  removeRole,
  ensureUserRole
};
