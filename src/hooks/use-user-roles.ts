
import { useEffect, useState, useRef } from "react";
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
  
  // Use a ref to store whether we've already determined admin status
  const adminStatusDetermined = useRef(false);
  
  // Use a ref to store timeout IDs to properly clean them up
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkRoles = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsCheckingRoles(false);
        }
        return;
      }
      
      // Skip checks if we've already determined admin status
      if (adminStatusDetermined.current) {
        setIsCheckingRoles(false);
        return;
      }
      
      try {
        // Only set isCheckingRoles to true for confirmed admin users
        // For our first check, we'll do a quick check without showing the loading state
        const quickAdminCheck = await adminService.isAdmin();
        
        if (quickAdminCheck) {
          // Only show loading state for actual admin users
          setIsCheckingRoles(true);
        }
        
        setRoleCheckError(null);
        
        if (isMounted) {
          setIsAdmin(quickAdminCheck);
          
          // Mark that we've determined the admin status
          if (quickAdminCheck) {
            adminStatusDetermined.current = true;
          }
          
          // Check beta tester role regardless of admin status
          try {
            // Explicitly log and wait for the beta check
            console.log("Checking beta tester role...");
            const betaCheck = await adminService.checkUserRole('beta_tester');
            console.log("Beta tester check completed with result:", betaCheck);
            
            if (isMounted) {
              // Force state update for beta tester status
              setIsBetaTester(!!betaCheck);
              console.log("Setting isBetaTester state to:", !!betaCheck);
            }
          } catch (betaError) {
            console.error("Error during beta tester check:", betaError);
            // Don't interrupt flow on beta check error
          }
          
          // Check and ensure user role
          try {
            const userCheck = await adminService.ensureUserRole();
            if (isMounted) {
              setIsUser(userCheck);
            }
          } catch (userError) {
            console.error("Error during user role check:", userError);
            // Don't interrupt flow on user check error
          }
          
          setIsCheckingRoles(false);
        }
      } catch (err) {
        console.error("Error checking user roles:", err);
        
        if (isMounted) {
          // Only show error for admin users
          if (isAdmin) {
            setRoleCheckError("Could not verify user roles");
          }
          
          // Fewer retry attempts to reduce API load
          if (adminCheckAttempts < 1 && !adminStatusDetermined.current) {
            const nextAttempt = adminCheckAttempts + 1;
            setAdminCheckAttempts(nextAttempt);
            console.log(`Retrying admin check (attempt ${nextAttempt} of 1)...`);
            
            // Use a longer delay to reduce API pressure (5 seconds)
            const delay = 5000;
            
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
              toast.error("Failed to check admin status", { 
                description: "Please refresh the page or try again later",
                id: "admin-check-error" // Prevent duplicate toasts
              });
            }
            setIsCheckingRoles(false);
          }
        }
      }
    };
    
    // Run the check immediately
    checkRoles();
    
    // Also set up a separate beta role checker that runs more often to ensure beta roles are caught
    const checkBetaRole = async () => {
      if (session?.user) {
        try {
          console.log("Performing dedicated beta role check...");
          const betaCheck = await adminService.checkUserRole('beta_tester');
          console.log("Dedicated beta check result:", betaCheck);
          
          if (isMounted) {
            // Force state update for beta tester status
            setIsBetaTester(!!betaCheck);
            console.log("Updated isBetaTester state to:", !!betaCheck);
          }
        } catch (error) {
          console.error("Error in dedicated beta role check:", error);
        }
      }
    };
    
    // Run the beta check after a short delay
    const betaCheckTimer = setTimeout(checkBetaRole, 1500);
    
    return () => {
      isMounted = false;
      // Clear any pending timeouts on unmount
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearTimeout(betaCheckTimer);
    };
  }, [session, adminCheckAttempts]);

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
