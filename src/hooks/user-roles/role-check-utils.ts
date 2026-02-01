
import { supabase } from "@/integrations/supabase/client";
import { UserRoleRefs } from "./types";

// Cache duration in milliseconds (10 seconds - increased from 5)
const CACHE_DURATION = 10000;

/**
 * Dedicated function to check admin role using direct RPC
 * with caching to avoid hammering the server
 */
export const checkAdminRole = async (
  userId: string | undefined,
  refs: UserRoleRefs,
  forceUpdate = false
): Promise<boolean> => {
  if (!userId || (refs.checkingInProgress && !forceUpdate)) {
    return refs.adminStatus;
  }
  
  // Use cached value if available and not forced
  const now = Date.now();
  if (!forceUpdate && refs.lastCheckedTime && (now - refs.lastCheckedTime < CACHE_DURATION)) {
    console.log("Using cached admin status:", refs.adminStatus);
    return refs.adminStatus;
  }
  
  try {
    refs.checkingInProgress = true;
    
    // Use the is_admin RPC function
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error("Admin RPC check error:", error);
      refs.checkingInProgress = false;
      return refs.adminStatus;
    }
    
    // Update the last checked time
    refs.lastCheckedTime = now;
    
    console.log("Admin RPC check result:", data, "at", new Date().toISOString());
    
    // Return the result as a boolean
    refs.checkingInProgress = false;
    return !!data;
  } catch (error) {
    console.error("Error in direct admin role check:", error);
    refs.checkingInProgress = false;
    refs.lastNetworkErrorTime = Date.now();
    return refs.adminStatus;
  }
};

/**
 * Dedicated function to check system admin role using direct RPC
 * with caching to avoid hammering the server
 */
export const checkSystemAdminRole = async (
  userId: string | undefined,
  refs: UserRoleRefs & { systemAdminStatus: boolean },
  forceUpdate = false
): Promise<boolean> => {
  if (!userId || (refs.checkingInProgress && !forceUpdate)) {
    return refs.systemAdminStatus;
  }
  
  // Use cached value if available and not forced
  const now = Date.now();
  if (!forceUpdate && refs.lastCheckedTime && (now - refs.lastCheckedTime < CACHE_DURATION)) {
    console.log("Using cached system admin status:", refs.systemAdminStatus);
    return refs.systemAdminStatus;
  }
  
  try {
    refs.checkingInProgress = true;
    
    // Use the is_system_admin RPC function
    const { data, error } = await supabase.rpc('is_system_admin');
    
    if (error) {
      console.error("System Admin RPC check error:", error);
      refs.checkingInProgress = false;
      return refs.systemAdminStatus;
    }
    
    // Update the last checked time
    refs.lastCheckedTime = now;
    
    console.log("System Admin RPC check result:", data, "at", new Date().toISOString());
    
    // Return the result as a boolean
    refs.checkingInProgress = false;
    return !!data;
  } catch (error) {
    console.error("Error in direct system admin role check:", error);
    refs.checkingInProgress = false;
    refs.lastNetworkErrorTime = Date.now();
    return refs.systemAdminStatus;
  }
};

/**
 * Update the references and state based on the admin check result
 */
export const updateAdminState = (
  newStatus: boolean,
  currentStatus: boolean,
  refs: { adminStatus: boolean },
  setIsAdmin: (value: boolean) => void,
  forceUpdate = false
): void => {
  // Only trigger state updates if the status actually changed or force update requested
  if (newStatus !== currentStatus || forceUpdate) {
    refs.adminStatus = newStatus;
    
    // Use direct value since the type has been updated
    setIsAdmin(newStatus);
    
    if (newStatus !== currentStatus) {
      console.log("Admin state updated", {
        newStatus,
        ref: refs.adminStatus,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Update the references and state based on the system admin check result
 */
export const updateSystemAdminState = (
  newStatus: boolean,
  currentStatus: boolean,
  refs: { systemAdminStatus: boolean },
  setIsSystemAdmin: (updater: (prev: boolean) => boolean) => void,
  forceUpdate = false
): void => {
  // Only trigger state updates if the status actually changed or force update requested
  if (newStatus !== currentStatus || forceUpdate) {
    refs.systemAdminStatus = newStatus;
    
    // Use a function updater to ensure React picks up the state change
    setIsSystemAdmin((prev) => {
      if (prev !== newStatus) {
        console.log(`Updating system admin state from ${prev} to ${newStatus}`);
      }
      return newStatus;
    });
    
    if (newStatus !== currentStatus) {
      console.log("System admin state updated", {
        newStatus,
        ref: refs.systemAdminStatus,
        timestamp: new Date().toISOString()
      });
    }
  }
};
