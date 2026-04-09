
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
  if (!userId) {
    return refs.adminStatus;
  }
  
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error("Admin RPC check error:", error);
      return refs.adminStatus;
    }
    
    console.log("Admin RPC check result:", data, "at", new Date().toISOString());
    return !!data;
  } catch (error) {
    console.error("Error in direct admin role check:", error);
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
  if (!userId) {
    return refs.systemAdminStatus;
  }
  
  try {
    const { data, error } = await supabase.rpc('is_system_admin');
    
    if (error) {
      console.error("System Admin RPC check error:", error);
      return refs.systemAdminStatus;
    }
    
    console.log("System Admin RPC check result:", data, "at", new Date().toISOString());
    return !!data;
  } catch (error) {
    console.error("Error in direct system admin role check:", error);
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
