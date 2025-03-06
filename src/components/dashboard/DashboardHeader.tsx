
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { WelcomeMessage } from "./WelcomeMessage";
import { ActionButtons } from "./ActionButtons";
import { useUserRoles } from "@/hooks/user-roles";
import { useEffect, useRef } from "react";

/**
 * DashboardHeader component displays user information, subscription status,
 * and action buttons including admin dashboard access if the user is an admin.
 * 
 * It handles:
 * - Displaying welcome message with user's name
 * - Showing subscription plan information
 * - Checking user roles (admin, beta tester, developer)
 * - Providing quick access buttons (report issue, docs, settings)
 * - Showing admin dashboard button for admins
 * - Showing beta dashboard button for beta testers
 * - Showing developer tools for developers
 */
export default function DashboardHeader() {
  const { isLoading, error } = useSubscriptionFeatures();
  const { 
    isCheckingRoles, 
    showAdminButton, 
    showBetaBadge,
    showDeveloperTools,
    roleCheckError,
    isBetaTester,
    isAdmin,
    isDeveloper,
    forceRoleCheck
  } = useUserRoles();
  
  const hasLoggedBetaStatus = useRef(false);
  const hasLoggedDevStatus = useRef(false);
  
  useEffect(() => {
    forceRoleCheck();
    const interval = setInterval(() => {
      forceRoleCheck();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [forceRoleCheck]);
  
  useEffect(() => {
    console.log("Dashboard Header - Current role states:", {
      isAdmin,
      isBetaTester,
      isDeveloper,
      showBetaBadge,
      showAdminButton,
      showDeveloperTools,
      isCheckingRoles,
      roleCheckError,
      timestamp: new Date().toISOString()
    });
    
    if (isBetaTester && !hasLoggedBetaStatus.current) {
      console.log("Beta tester status confirmed in Header", {
        timestamp: new Date().toISOString(),
        isBetaTester,
        showBetaBadge
      });
      hasLoggedBetaStatus.current = true;
    }
    
    if (isDeveloper && !hasLoggedDevStatus.current) {
      console.log("Developer status confirmed in Header", {
        timestamp: new Date().toISOString(),
        isDeveloper,
        showDeveloperTools
      });
      hasLoggedDevStatus.current = true;
    }
  }, [isAdmin, isBetaTester, isDeveloper, showBetaBadge, showAdminButton, showDeveloperTools, isCheckingRoles, roleCheckError]);

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-brand-silver">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <WelcomeMessage />
          
          <ActionButtons 
            isCheckingRoles={isCheckingRoles}
            showAdminButton={showAdminButton}
            showBetaBadge={showBetaBadge}
            showDeveloperTools={showDeveloperTools}
            roleCheckError={roleCheckError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
