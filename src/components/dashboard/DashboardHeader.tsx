
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { WelcomeMessage } from "./WelcomeMessage";
import { ActionButtons } from "./ActionButtons";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useEffect } from "react";

/**
 * DashboardHeader component displays user information, subscription status,
 * and action buttons including admin dashboard access if the user is an admin.
 * 
 * It handles:
 * - Displaying welcome message with user's name
 * - Showing subscription plan information
 * - Checking user roles (admin, beta tester)
 * - Providing quick access buttons (report issue, docs, settings)
 * - Showing admin dashboard button for admins
 */
export default function DashboardHeader() {
  const { isLoading, error } = useSubscriptionFeatures();
  const { 
    isCheckingRoles, 
    showAdminButton, 
    showBetaBadge, 
    roleCheckError,
    isBetaTester,
    isAdmin
  } = useUserRoles();
  
  useEffect(() => {
    console.log("Dashboard Header - Current role states:", {
      isAdmin,
      isBetaTester,
      showBetaBadge,
      showAdminButton,
      isCheckingRoles,
      roleCheckError
    });
  }, [isAdmin, isBetaTester, showBetaBadge, showAdminButton, isCheckingRoles, roleCheckError]);

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-brand-silver">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <WelcomeMessage />
          
          <ActionButtons 
            isCheckingRoles={isCheckingRoles}
            showAdminButton={showAdminButton}
            showBetaBadge={showBetaBadge}
            roleCheckError={roleCheckError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
