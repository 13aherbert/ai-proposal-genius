import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  HelpCircle, 
  MessageSquarePlus, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  Code2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserFeedbackDialog } from "../feedback/UserFeedbackDialog";
import { useEffect } from "react";

interface ActionButtonsProps {
  isCheckingRoles: boolean;
  showAdminButton: boolean;
  showBetaBadge: boolean;
  showDeveloperTools: boolean;
  roleCheckError: string | null;
}

/**
 * ActionButtons component displays various action buttons based on the user's roles.
 * It handles:
 * - Showing admin dashboard button for admins
 * - Showing beta program badge/button for beta testers
 * - Showing developer tools for developers
 * - Displaying feedback button for all users
 */
export function ActionButtons({
  isCheckingRoles,
  showAdminButton,
  showBetaBadge,
  showDeveloperTools,
  roleCheckError
}: ActionButtonsProps) {
  const navigate = useNavigate();
  const { setIsOpen: setFeedbackOpen } = useUserFeedbackDialog();
  
  useEffect(() => {
    console.log("ActionButtons - Received props:", { 
      showAdminButton, 
      showBetaBadge,
      showDeveloperTools,
      timestamp: new Date().toISOString()
    });
  }, [showAdminButton, showBetaBadge, showDeveloperTools]);

  // Render
  return (
    <div className="flex flex-wrap justify-end items-center gap-2">
      {/* Display role check error if any */}
      {roleCheckError && (
        <Badge variant="destructive" className="animate-pulse">
          {roleCheckError}
        </Badge>
      )}
      
      {/* Display loading indicator when checking roles */}
      {isCheckingRoles && (
        <Skeleton className="h-9 w-9 rounded-md" />
      )}
      
      {/* Beta Program Button */}
      {showBetaBadge && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/beta-program')}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Beta Program</span>
          <Badge variant="secondary" className="ml-1 bg-amber-400/20 text-amber-500">Beta</Badge>
        </Button>
      )}
      
      {/* Developer Tools Button */}
      {showDeveloperTools && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/developer')}
        >
          <Code2 className="h-4 w-4 text-green-400" />
          <span>Developer Tools</span>
          <Badge variant="secondary" className="ml-1 bg-green-400/20 text-green-500">Dev</Badge>
        </Button>
      )}
      
      {/* Admin Dashboard Button */}
      {showAdminButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ShieldCheck className="h-4 w-4 text-red-500" />
          <span>Admin Dashboard</span>
        </Button>
      )}
      
      {/* Documentation Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate('/docs')}
        title="Documentation"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      
      {/* Feedback Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setFeedbackOpen(true)}
        title="Provide Feedback"
      >
        <MessageSquarePlus className="h-4 w-4" />
      </Button>
      
      {/* Settings Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigate('/account')}
        title="Account Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
