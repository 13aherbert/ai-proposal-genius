
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Settings, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserFeedbackDialog } from "@/components/feedback/UserFeedbackDialog";

type ActionButtonsProps = {
  isCheckingRoles: boolean;
  showAdminButton: boolean;
  roleCheckError: string | null;
};

export function ActionButtons({ 
  isCheckingRoles, 
  showAdminButton, 
  roleCheckError 
}: ActionButtonsProps) {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {showAdminButton && (
        <Button 
          variant="outline" 
          className="bg-black/20 border-brand-silver hover:bg-black/40"
          onClick={() => navigate('/admin')}
        >
          <Shield className="h-5 w-5 mr-2" />
          Admin Dashboard
        </Button>
      )}
      
      
      {roleCheckError && !isCheckingRoles && (
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
