
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

  // Dedicated function to check beta tester role
  const checkBetaTesterRole = useCallback(async () => {
    if (!session?.user) return false;
    
    console.log("Performing dedicated beta role check...");
    try {
      const betaCheck = await adminService.checkUserRole('beta_tester');
      console.log(`Dedicated beta check result: ${betaCheck}`);
      
      // Force state update for beta tester status
      setIsBetaTester(!!betaCheck);
      betaStatusDetermined.current = true;
      
      return !!betaCheck;
    } catch (error) {
      console.error("Error in dedicated beta role check:", error);
      return false;
    }
  }, [session]);
  
  useEffect(() => {
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
            setIsAdmin(adminCheck);
            
            // Mark that we've determined the admin status
            if (adminCheck) {
              adminStatusDetermined.current = true;
            }
          }
        }
        
        // Check beta tester role
        if (!betaStatusDetermined.current) {
          console.log("Checking beta tester role...");
          const betaCheck = await checkBetaTesterRole();
          
          if (isMounted) {
            setIsBetaTester(betaCheck);
            
            // Mark that we've determined the beta tester status
            if (betaCheck) {
              betaStatusDetermined.current = true;
            }
          }
        }
        
        // Check and ensure user role
        try {
          const userCheck = await adminService.ensureUserRole();
          if (isMounted) {
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
    
    // Also set up a separate beta role checker that runs every few seconds
    // to ensure beta roles are properly detected
    const betaCheckInterval = setInterval(async () => {
      if (session?.user && !betaStatusDetermined.current) {
        try {
          const betaCheck = await checkBetaTesterRole();
          if (betaCheck && isMounted) {
            console.log("Beta role detected in interval check!");
            setIsBetaTester(true);
            betaStatusDetermined.current = true;
          }
        } catch (error) {
          console.error("Error in beta role interval check:", error);
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
      clearInterval(betaCheckInterval);
    };
  }, [session, adminCheckAttempts, checkBetaTesterRole]);

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
