import { WelcomeMessage } from "./WelcomeMessage";
import { ActionButtons } from "./ActionButtons";
import { useUserRoles } from "@/hooks/user-roles";
import { useEffect, useRef } from "react";

/**
 * DashboardHeader - slim inline welcome bar.
 * Shows greeting + plan badge on the left, admin button on the right.
 */
export default function DashboardHeader() {
  const {
    isCheckingRoles,
    showAdminButton,
    roleCheckError,
    forceRoleCheck
  } = useUserRoles();
  const hasCheckedRoles = useRef(false);

  useEffect(() => {
    if (!hasCheckedRoles.current) {
      forceRoleCheck();
      hasCheckedRoles.current = true;
    }
  }, [forceRoleCheck]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
      <WelcomeMessage />
      <ActionButtons
        isCheckingRoles={isCheckingRoles}
        showAdminButton={showAdminButton}
        roleCheckError={roleCheckError}
      />
    </div>
  );
}
