
import { supabase } from "@/integrations/supabase/client";
import { UserRoleRefs } from "./types";

// Cache duration in milliseconds (5 seconds)
const CACHE_DURATION = 5000;

/**
 * Dedicated function to check beta tester role using the direct RPC function
 * with caching to avoid hammering the server
 */
export const checkBetaTesterRole = async (
  userId: string | undefined,
  refs: UserRoleRefs,
  forceUpdate = false
): Promise<boolean> => {
  if (!userId || (refs.checkingInProgress && !forceUpdate)) {
    return refs.betaTesterStatus;
  }
  
  // Use cached value if available and not forced
  const now = Date.now();
  if (!forceUpdate && refs.lastCheckedTime && (now - refs.lastCheckedTime < CACHE_DURATION)) {
    console.log("Using cached beta tester status:", refs.betaTesterStatus);
    return refs.betaTesterStatus;
  }
  
  try {
    refs.checkingInProgress = true;
    
    // Use the RPC function that directly checks the beta_tester role
    const { data, error } = await supabase.rpc('check_beta_tester_role', {
      user_id_param: userId
    });
    
    if (error) {
      console.error("Beta tester RPC check error:", error);
      refs.checkingInProgress = false;
      return refs.betaTesterStatus;
    }
    
    // Update the last checked time
    refs.lastCheckedTime = now;
    
    console.log("Beta tester RPC check result:", data, "at", new Date().toISOString());
    
    // Return the result as a boolean
    refs.checkingInProgress = false;
    return !!data;
  } catch (error) {
    console.error("Error in direct beta role check:", error);
    refs.checkingInProgress = false;
    refs.lastNetworkErrorTime = Date.now();
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
      if (prev !== newStatus) {
        console.log(`Updating beta tester state from ${prev} to ${newStatus}`);
      }
      return newStatus;
    });
    
    if (newStatus !== currentStatus) {
      console.log("Beta tester state updated", {
        newStatus,
        ref: refs.betaTesterStatus,
        timestamp: new Date().toISOString()
      });
    }
  }
};
