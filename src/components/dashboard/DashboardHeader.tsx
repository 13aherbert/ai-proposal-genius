import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { WelcomeMessage } from "./WelcomeMessage";
import { ActionButtons } from "./ActionButtons";
import { useUserRoles } from "@/hooks/user-roles";
import { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/subscription";

/**
 * DashboardHeader component displays user information, subscription status,
 * and action buttons including admin dashboard access if the user is an admin.
 * 
 * It handles:
 * - Displaying welcome message with user's name
 * - Showing subscription plan information
 * - Checking user roles (admin)
 * - Providing quick access buttons (report issue, docs, settings)
 * - Showing admin dashboard button for admins
 */
export default function DashboardHeader() {
  const {
    isLoading,
    error
  } = useSubscriptionFeatures();
  const subscriptionData = useSubscription();
  const {
    isCheckingRoles,
    showAdminButton,
    roleCheckError,
    isAdmin,
    forceRoleCheck
  } = useUserRoles();
  const hasCheckedRoles = useRef(false);

  // Only force a check once on initial render
  useEffect(() => {
    if (!hasCheckedRoles.current) {
      forceRoleCheck();
      hasCheckedRoles.current = true;
    }
  }, [forceRoleCheck]);
  
  return <div className="mt-3 flex justify-center">
      <Card className="bg-brand-green border-0 w-full rounded-none">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <WelcomeMessage />
            
            <ActionButtons isCheckingRoles={isCheckingRoles} showAdminButton={showAdminButton} roleCheckError={roleCheckError} />
          </div>
        </CardContent>
      </Card>
    </div>;
}
