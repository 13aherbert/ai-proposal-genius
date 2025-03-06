import { supabase } from "@/integrations/supabase/client";
import { UserRoleRefs } from "./types";

/**
 * Dedicated function to check beta tester role using the direct RPC function
 */
export const checkBetaTesterRole = async (
  userId: string | undefined,
  refs: { betaTesterStatus: boolean; checkingInProgress: boolean },
  forceUpdate = false
): Promise<boolean> => {
  if (!userId || (refs.checkingInProgress && !forceUpdate)) {
    return refs.betaTesterStatus;
  }
  
  try {
    console.log("Starting beta tester role check for user:", userId);
    
    // Use the RPC function that directly checks the beta_tester role
    const { data, error } = await supabase.rpc('check_beta_tester_role', {
      user_id_param: userId
    });
    
    if (error) {
      console.error("Beta tester RPC check error:", error);
      return refs.betaTesterStatus;
    }
    
    console.log("Beta tester RPC check result:", data, "at", new Date().toISOString());
    
    // Return the result as a boolean
    return !!data;
  } catch (error) {
    console.error("Error in direct beta role check:", error);
    return refs.betaTesterStatus;
  }
};

/**
 * Update the references and state based on the beta tester check result
 */
export const updateBetaTesterState = (
  newStatus: boolean,
  currentStatus: boolean,
  refs: { betaTesterStatus: boolean },
  setIsBetaTester: (updater: (prev: boolean) => boolean) => void,
  forceUpdate = false
): void => {
  // Only trigger state updates if the status actually changed or force update requested
  if (newStatus !== currentStatus || forceUpdate) {
    refs.betaTesterStatus = newStatus;
    
    // Use a function updater to ensure React picks up the state change
    setIsBetaTester((prev) => {
      console.log(`Updating beta tester state from ${prev} to ${newStatus}`);
      return newStatus;
    });
    
    console.log("Beta tester state updated", {
      newStatus,
      ref: refs.betaTesterStatus,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Dedicated function to check developer role
 */
export const checkDeveloperRole = async (
  userId: string | undefined,
  refs: { developerStatus: boolean; checkingInProgress: boolean },
  forceUpdate = false
): Promise<boolean> => {
  if (!userId || (refs.checkingInProgress && !forceUpdate)) {
    return refs.developerStatus;
  }
  
  try {
    console.log("Starting developer role check for user:", userId);
    
    // Use the generic check_user_role RPC function
    const { data, error } = await supabase.rpc('check_user_role', {
      user_id_param: userId,
      role_param: 'developer'
    });
    
    if (error) {
      console.error("Developer role check error:", error);
      return refs.developerStatus;
    }
    
    console.log("Developer role check result:", data, "at", new Date().toISOString());
    
    // Return the result as a boolean
    return !!data;
  } catch (error) {
    console.error("Error in developer role check:", error);
    return refs.developerStatus;
  }
};

/**
 * Update the references and state based on the developer check result
 */
export const updateDeveloperState = (
  newStatus: boolean,
  currentStatus: boolean,
  refs: { developerStatus: boolean },
  setIsDeveloper: (updater: (prev: boolean) => boolean) => void,
  forceUpdate = false
): void => {
  // Only trigger state updates if the status actually changed or force update requested
  if (newStatus !== currentStatus || forceUpdate) {
    refs.developerStatus = newStatus;
    
    // Use a function updater to ensure React picks up the state change
    setIsDeveloper((prev) => {
      console.log(`Updating developer state from ${prev} to ${newStatus}`);
      return newStatus;
    });
    
    console.log("Developer state updated", {
      newStatus,
      ref: refs.developerStatus,
      timestamp: new Date().toISOString()
    });
  }
};
