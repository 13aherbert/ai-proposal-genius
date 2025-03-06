
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Crown, Settings, Users, Beaker } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Only show the "Checking roles..." badge if we're checking AND we've confirmed it's an admin user */}
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
      
      {/* Beta Tester Button - Only show for beta testers */}
      {showBetaBadge && (
        <Button 
          variant="outline" 
          className="bg-black/20 border-brand-silver hover:bg-black/40"
          onClick={() => navigate('/beta')}
        >
          <Beaker className="h-5 w-5 mr-2" />
          Beta Dashboard
        </Button>
      )}
      
      {showBetaBadge && (
        <Badge variant="outline" className="py-2 px-3">
          <Crown className="h-4 w-4 mr-1" />
          Beta Tester
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
                onClick={() => window.open('/some-issue-reporting-url', '_blank')}
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
    </div>
  );
}
