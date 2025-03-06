
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); 
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  const [adminCheckAttempts, setAdminCheckAttempts] = useState(0);
  
  // Use refs to store whether we've already determined role statuses
  const adminStatusDetermined = useRef(false);
  const betaStatusDetermined = useRef(false);
  
  // Use a ref to store timeout IDs to properly clean them up
  const timeoutRef = useRef<number | null>(null);
  
  // Use ref to track whether roles have been checked this session
  const rolesCheckedRef = useRef(false);

  // Dedicated function to check beta tester role
  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user) return false;
    
    console.log("Performing dedicated beta role check...");
    try {
      const betaCheck = await adminService.checkUserRole('beta_tester');
      
      // Only update state if the status has changed
      if (!!betaCheck !== isBetaTester) {
        setIsBetaTester(!!betaCheck);
      }
      
      if (!!betaCheck) {
        betaStatusDetermined.current = true;
      }
      
      return !!betaCheck;
    } catch (error) {
      console.error("Error in dedicated beta role check:", error);
      return false;
    }
  }, [session, isBetaTester]);
  
  useEffect(() => {
    // Only run this effect once per session
    if (rolesCheckedRef.current && session?.user) return;
    
    let isMounted = true;
    
    const checkRoles = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsCheckingRoles(false);
          setIsAdmin(false);
          setIsBetaTester(false);
          setIsUser(false);
        }
        return;
      }
      
      // Mark that we've started checking roles this session
      rolesCheckedRef.current = true;
      
      try {
        // Only set isCheckingRoles to true for the first check
        if (!adminStatusDetermined.current && !betaStatusDetermined.current) {
          setIsCheckingRoles(true);
        }
        
        setRoleCheckError(null);
        
        // Check admin status if not already determined
        if (!adminStatusDetermined.current) {
          const adminCheck = await adminService.isAdmin();
          
          if (isMounted) {
            console.log("Is admin check result:", adminCheck);
            
            // Only update if the value is different to avoid re-renders
            if (adminCheck !== isAdmin) {
              setIsAdmin(adminCheck);
            }
            
            // Mark that we've determined the admin status
            if (adminCheck) {
              adminStatusDetermined.current = true;
            }
          }
        }
        
        // Check beta tester role
        if (!betaStatusDetermined.current) {
          console.log("Checking beta tester role...");
          await checkBetaTesterRole();
        }
        
        // Check and ensure user role
        try {
          const userCheck = await adminService.ensureUserRole();
          if (isMounted && userCheck !== isUser) {
            setIsUser(userCheck);
          }
        } catch (userError) {
          console.error("Error during user role check:", userError);
        }
        
        if (isMounted) {
          setIsCheckingRoles(false);
        }
      } catch (err) {
        console.error("Error checking user roles:", err);
        
        if (isMounted) {
          // Only show error for admin users
          if (isAdmin) {
            setRoleCheckError("Could not verify user roles");
          }
          
          // Retry once if needed
          if (adminCheckAttempts < 1 && !adminStatusDetermined.current) {
            const nextAttempt = adminCheckAttempts + 1;
            setAdminCheckAttempts(nextAttempt);
            console.log(`Retrying role checks (attempt ${nextAttempt} of 1)...`);
            
            // Use a longer delay (3 seconds)
            const delay = 3000;
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            // Store the timeout ID for cleanup
            timeoutRef.current = window.setTimeout(() => {
              if (isMounted) {
                setRoleCheckError(null);
                checkRoles();
              }
            }, delay);
          } else {
            // If we've exceeded retry attempts, just finish the checking process
            if (isAdmin) {
              toast.error("Failed to check role status", { 
                description: "Please refresh the page or try again later",
                id: "role-check-error"
              });
            }
            setIsCheckingRoles(false);
          }
        }
      }
    };
    
    // Run the check immediately
    checkRoles();
    
    // Set up a separate beta role checker that runs once instead of interval
    // to ensure beta roles are properly detected without continuous polling
    const betaCheckTimeout = window.setTimeout(async () => {
      if (session?.user && !betaStatusDetermined.current) {
        try {
          const betaCheck = await checkBetaTesterRole();
          if (betaCheck && isMounted) {
            console.log("Beta role detected in delayed check!");
            if (!isBetaTester) {
              setIsBetaTester(true);
            }
            betaStatusDetermined.current = true;
          }
        } catch (error) {
          console.error("Error in beta role delayed check:", error);
        }
      }
    }, 3000);
    
    return () => {
      isMounted = false;
      // Clear any pending timeouts on unmount
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearTimeout(betaCheckTimeout);
    };
  }, [session, adminCheckAttempts, checkBetaTesterRole, isAdmin, isBetaTester, isUser]);

  // Calculate derived values outside of useEffect to ensure they're updated when state changes
  const showAdminButton = isAdmin && !isCheckingRoles;
  const showBetaBadge = isBetaTester && !isCheckingRoles;

  console.log("useUserRoles final state values:", { isAdmin, isBetaTester, isUser, showAdminButton, showBetaBadge });

  return {
    isAdmin,
    isBetaTester,
    isUser,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge
  };
}
