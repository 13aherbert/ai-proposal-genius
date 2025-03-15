
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { WelcomeMessage } from "./WelcomeMessage";
import { ActionButtons } from "./ActionButtons";
import { useUserRoles } from "@/hooks/user-roles";
import { useEffect, useRef, useState } from "react";
import { usePerformance } from "@/hooks/use-performance";

interface DashboardHeaderProps {
  onLoaded?: () => void;
}

/**
 * DashboardHeader component displays user information, subscription status,
 * and action buttons including admin dashboard access if the user is an admin.
 */
export default function DashboardHeader({ onLoaded }: DashboardHeaderProps) {
  const { isLoading: isLoadingSubscription } = useSubscriptionFeatures();
  const { 
    isCheckingRoles, 
    showAdminButton, 
    showBetaBadge, 
    isBetaTester,
    isAdmin,
    forceRoleCheck
  } = useUserRoles();
  
  const [isReady, setIsReady] = useState(false);
  const hasCheckedRoles = useRef(false);
  const hasCalledOnLoaded = useRef(false);
  const { trackRender } = usePerformance('DashboardHeader');
  
  // Only force a check once on initial render with a delayed execution
  useEffect(() => {
    if (!hasCheckedRoles.current) {
      const timer = setTimeout(() => {
        forceRoleCheck();
        hasCheckedRoles.current = true;
      }, 100); // Slight delay to allow other critical components to load first
      
      return () => clearTimeout(timer);
    }
  }, [forceRoleCheck]);
  
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

  // Determine when header is fully loaded and ready
  useEffect(() => {
    if (!isCheckingRoles && !isLoadingSubscription && !isReady) {
      setIsReady(true);
      
      // Call onLoaded callback if provided
      if (onLoaded && !hasCalledOnLoaded.current) {
        onLoaded();
        hasCalledOnLoaded.current = true;
      }
    }
  }, [isCheckingRoles, isLoadingSubscription, isReady, onLoaded]);

  // Track performance
  trackRender();

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-brand-silver">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <WelcomeMessage />
          
          <ActionButtons 
            isCheckingRoles={isCheckingRoles}
            showAdminButton={showAdminButton}
            showBetaBadge={showBetaBadge}
          />
        </div>
      </CardContent>
    </Card>
  );
}
