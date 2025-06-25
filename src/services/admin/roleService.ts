
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
import { supabase } from "@/integrations/supabase/client";

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
 * Checks if the current user has the beta_tester role
 * This specific implementation uses a direct RPC call to avoid RLS recursion issues
 */
export const isBetaTester = async (): Promise<boolean> => {
  try {
    console.log("isBetaTester service: Starting check", new Date().toISOString());
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("isBetaTester service: No authenticated user", userError);
      return false;
    }
    
    const userId = userData.user.id;
    console.log(`isBetaTester service: Checking for user ID ${userId}`);
    
    // Use the dedicated beta tester RPC function
    const { data, error } = await supabase.rpc('check_beta_tester_role', {
      user_id_param: userId
    });
    
    if (error) {
      console.error("isBetaTester service: Error checking role", error);
      return false;
    }
    
    const result = !!data;
    console.log(`isBetaTester service: Check result = ${result}`, { 
      data, 
      userId,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Error in isBetaTester check:', error);
    return false;
  }
};

/**
 * Checks if the current user has the system_admin role
 * This specific implementation uses a direct RPC call to avoid RLS recursion issues
 */
export const isSystemAdminRole = async (): Promise<boolean> => {
  try {
    console.log("isSystemAdminRole service: Starting check", new Date().toISOString());
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("isSystemAdminRole service: No authenticated user", userError);
      return false;
    }
    
    const userId = userData.user.id;
    console.log(`isSystemAdminRole service: Checking for user ID ${userId}`);
    
    // Use the dedicated system admin RPC function
    const { data, error } = await supabase.rpc('check_system_admin_role', {
      user_id_param: userId
    });
    
    if (error) {
      console.error("isSystemAdminRole service: Error checking role", error);
      return false;
    }
    
    const result = !!data;
    console.log(`isSystemAdminRole service: Check result = ${result}`, { 
      data, 
      userId,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Error in isSystemAdminRole check:', error);
    return false;
  }
};
