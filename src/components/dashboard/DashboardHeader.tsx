
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
 * - Checking user roles (admin, beta tester)
 * - Providing quick access buttons (report issue, docs, settings)
 * - Showing admin dashboard button for admins
 * - Showing beta dashboard button for beta testers
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
    showBetaBadge,
    roleCheckError,
    isBetaTester,
    isAdmin,
    forceRoleCheck
  } = useUserRoles();
  const hasCheckedRoles = useRef(false);

  // Only force a check once on initial render
  useEffect(() => {
    if (!hasCheckedRoles.current) {
      // Log that we're doing the initial check
      console.log("Performing initial role check in DashboardHeader");
      forceRoleCheck();
      hasCheckedRoles.current = true;
    }
  }, [forceRoleCheck]);

  // Log subscription states in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("DashboardHeader subscription states:", {
        subscription: subscriptionData.subscription,
        hasCheckedSubscription: subscriptionData.hasCheckedSubscription,
        timestamp: new Date().toISOString()
      });
    }
  }, [subscriptionData.subscription, subscriptionData.hasCheckedSubscription]);

  // Log role states in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("DashboardHeader role states:", {
        isAdmin,
        isBetaTester,
        showAdminButton,
        showBetaBadge,
        isCheckingRoles,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAdmin, isBetaTester, showAdminButton, showBetaBadge, isCheckingRoles]);
  
  return (
    <div className="mt-6 flex justify-center">
      <Card className="bg-brand-green border-0 w-full max-w-4xl">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <WelcomeMessage />
            
            <ActionButtons isCheckingRoles={isCheckingRoles} showAdminButton={showAdminButton} showBetaBadge={showBetaBadge} roleCheckError={roleCheckError} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
