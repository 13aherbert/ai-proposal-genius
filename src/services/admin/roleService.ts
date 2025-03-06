
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
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Checks if the current user has the beta_tester role
 * This specific implementation helps avoid RLS recursion issues
 */
export const isBetaTester = async (): Promise<boolean> => {
  try {
    console.log("isBetaTester: Starting check");
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("isBetaTester: No authenticated user", userError);
      return false;
    }
    
    const userId = userData.user.id;
    console.log(`isBetaTester: Checking for user ID ${userId}`);
    
    // Direct database query for maximum reliability
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'beta_tester')
      .maybeSingle();
    
    if (roleError) {
      console.error("isBetaTester: Error checking role", roleError);
      return false;
    }
    
    const isBeta = !!roleData;
    console.log(`isBetaTester: Check result = ${isBeta}`, roleData);
    
    return isBeta;
  } catch (error) {
    console.error('Error in isBetaTester check:', error);
    return false;
  }
};
