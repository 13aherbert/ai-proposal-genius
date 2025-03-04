
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

export function useUserRoles() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false); // Start with false to avoid initial flickering
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  const [adminCheckAttempts, setAdminCheckAttempts] = useState(0);
  
  // Use a ref to store whether we've already determined admin status
  // This helps prevent flashing by ensuring we only update the visibility state once
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
      
      // Don't start checking roles again if we've already determined admin status
      // This prevents unnecessary API calls that could lead to resource exhaustion
      if (adminStatusDetermined.current) {
        // console.log("Admin status already determined, skipping check");
        setIsCheckingRoles(false);
        return;
      }
      
      try {
        // Only set isCheckingRoles to true for confirmed admin users
        // For our first check, we'll do a quick check without showing the loading state
        // This prevents the loading indicator from showing to non-admin users
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
          
          // Only check beta tester role if not an admin (to avoid unnecessary calls)
          if (!quickAdminCheck) {
            const betaCheck = await adminService.checkUserRole('beta_tester');
            if (isMounted) {
              setIsBetaTester(betaCheck);
            }
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
    
    checkRoles();
    
    return () => {
      isMounted = false;
      // Clear any pending timeouts on unmount
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [session]);

  // Only show admin button if user is confirmed as admin and we're not in a checking state
  const showAdminButton = isAdmin && !isCheckingRoles;
  const showBetaBadge = isBetaTester && !isAdmin && !isCheckingRoles;

  return {
    isAdmin,
    isBetaTester,
    isCheckingRoles,
    roleCheckError,
    showAdminButton,
    showBetaBadge
  };
}
