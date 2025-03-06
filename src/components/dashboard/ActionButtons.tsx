
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Crown, Settings, Users, Beaker } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserFeedbackDialog } from "@/components/feedback/UserFeedbackDialog";

type ActionButtonsProps = {
  isCheckingRoles: boolean;
  showAdminButton: boolean;
  showBetaBadge: boolean;
  roleCheckError: string | null;
};

export function ActionButtons({ 
  isCheckingRoles, 
  showAdminButton, 
  showBetaBadge, 
  roleCheckError 
}: ActionButtonsProps) {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    console.log("ActionButtons rendered with props:", { 
      isCheckingRoles, 
      showAdminButton, 
      showBetaBadge, 
      roleCheckError,
      timestamp: new Date().toISOString()
    });
  }, [isCheckingRoles, showAdminButton, showBetaBadge, roleCheckError]);

  useEffect(() => {
    if (showBetaBadge) {
      console.log("🔍 Beta badge should be visible now", {
        showBetaBadge,
        timestamp: new Date().toISOString()
      });
    }
  }, [showBetaBadge]);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {isCheckingRoles && showAdminButton && (
        <Badge variant="outline" className="py-2 px-3">
          Checking roles...
        </Badge>
      )}
      
      {showAdminButton && (
        <Button 
          variant="outline" 
          className="bg-black/20 border-brand-silver hover:bg-black/40"
          onClick={() => navigate('/admin')}
        >
          <Users className="h-5 w-5 mr-2" />
          Admin Dashboard
        </Button>
      )}
      
      {showBetaBadge && (
        <>
          <Button 
            variant="outline" 
            className="bg-black/20 border-purple-400 hover:bg-black/40 border-2"
            onClick={() => {
              console.log("Navigating to beta dashboard", {
                timestamp: new Date().toISOString(),
                showBetaBadge
              });
              navigate('/beta');
            }}
          >
            <Beaker className="h-5 w-5 mr-2" />
            Beta Dashboard
          </Button>
          
          <Badge variant="outline" className="py-2 px-3 border-purple-400 bg-purple-900/20">
            <Crown className="h-4 w-4 mr-1" />
            Beta Tester
          </Badge>
        </>
      )}
      
      {import.meta.env.DEV && (
        <Badge variant="outline" className="py-2 px-3 bg-blue-900/20 border-blue-400">
          Beta Badge: {showBetaBadge ? 'Yes' : 'No'}
        </Badge>
      )}
      
      {roleCheckError && !isCheckingRoles && showAdminButton && (
        <Badge variant="destructive" className="py-2 px-3">
          <AlertCircle className="h-4 w-4 mr-1" />
          {roleCheckError}
        </Badge>
      )}
      
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setFeedbackOpen(true)}
              >
                <AlertCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Report an Issue</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate('/docs')}
              >
                <Book className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Documentation</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate('/account-settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Account Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      
      {/* Render the feedback dialog */}
      <UserFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        feedbackType="bug"
      />
    </div>
  );
}
