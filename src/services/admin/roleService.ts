
/**
 * Role Service
 * 
 * This service provides functions to check and manage user roles.
 * It is implemented to avoid row-level security recursion issues by using
 * direct queries and RPC functions where necessary.
 */

import { checkUserRole, isAdmin } from './utils/roleCheckers';
import { assignRole, removeRole, ensureUserRole, assignRoleByEmail } from './utils/roleManagement';
import type { UserRole } from './types';

// Re-export all utilities and types
export {
  checkUserRole,
  isAdmin,
  assignRole,
  assignRoleByEmail,
  removeRole,
  ensureUserRole,
};

// Re-export type
export type { UserRole };

// Add a specific beta tester check function
export const isBetaTester = async (): Promise<boolean> => {
  try {
    // Using direct query for more reliable results
    const result = await checkUserRole('beta_tester');
    console.log('isBetaTester check result:', result);
    return !!result;
  } catch (error) {
    console.error('Error in isBetaTester check:', error);
    return false;
  }
};

