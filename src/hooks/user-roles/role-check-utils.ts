
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
