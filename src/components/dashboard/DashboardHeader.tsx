
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { adminService } from "@/services/AdminService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Crown, Settings, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DashboardHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { plan, getProjectLimit, isLoading, error } = useSubscriptionFeatures();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const projectLimit = getProjectLimit();
  const isSubscriptionActive = plan && plan !== 'trial';
  
  useEffect(() => {
    const checkRoles = async () => {
      try {
        setIsCheckingRoles(true);
        
        if (session?.user) {
          // Check admin role
          const adminCheck = await adminService.isAdmin();
          setIsAdmin(adminCheck);
          
          // Only check beta tester role if not an admin (to avoid unnecessary calls)
          if (!adminCheck) {
            const betaCheck = await adminService.checkUserRole('beta_tester');
            setIsBetaTester(betaCheck);
          }
        }
      } catch (error) {
        console.error("Error checking user roles:", error);
      } finally {
        setIsCheckingRoles(false);
      }
    };
    
    checkRoles();
  }, [session]);

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-brand-silver">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome{session?.user?.user_metadata?.first_name ? `, ${session.user.user_metadata.first_name}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSubscriptionActive ? (
                <>
                  You're on the <Badge variant="outline" className="ml-1 font-semibold">{plan}</Badge> plan
                </>
              ) : (
                "Start creating AI-powered RFP responses"
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {!isCheckingRoles && isAdmin && (
              <Button 
                variant="outline" 
                className="bg-black/20 border-brand-silver hover:bg-black/40"
                onClick={() => navigate('/admin')}
              >
                <Users className="h-5 w-5 mr-2" />
                Admin Dashboard
              </Button>
            )}
            
            {!isCheckingRoles && isBetaTester && !isAdmin && (
              <Badge variant="outline" className="py-2 px-3">
                <Crown className="h-4 w-4 mr-1" />
                Beta Tester
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
        </div>
      </CardContent>
    </Card>
  );
}
