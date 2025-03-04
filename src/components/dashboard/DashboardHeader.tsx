import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { adminService } from "@/services/admin";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Crown, Settings, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { plan, getProjectLimit, isLoading, error } = useSubscriptionFeatures();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  const [adminCheckAttempts, setAdminCheckAttempts] = useState(0);
  const [adminButtonVisible, setAdminButtonVisible] = useState(false);
  
  const projectLimit = getProjectLimit();
  const isSubscriptionActive = plan && plan !== 'trial';
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | undefined;
    
    const checkRoles = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsCheckingRoles(false);
        }
        return;
      }
      
      try {
        setIsCheckingRoles(true);
        setRoleCheckError(null);
        
        // Check admin role using RPC function
        const adminCheck = await adminService.isAdmin();
        console.log("Admin check in DashboardHeader:", adminCheck);
        
        if (isMounted) {
          setIsAdmin(adminCheck);
          
          // Only show/hide admin button when we're confident about the status
          // This prevents flashing by only changing visibility when we have a confirmed state
          if (adminCheck) {
            setAdminButtonVisible(true);
          } else if (!adminCheckAttempts) {
            // Only hide the button on the first attempt if not admin
            // This prevents flickering during retries
            setAdminButtonVisible(false);
          }
          
          // Only check beta tester role if not an admin (to avoid unnecessary calls)
          if (!adminCheck) {
            const betaCheck = await adminService.checkUserRole('beta_tester');
            if (isMounted) {
              setIsBetaTester(betaCheck);
            }
          }
          
          setIsCheckingRoles(false);
        }
      } catch (err) {
        console.error("Error checking user roles:", err);
        
        if (isMounted) {
          setRoleCheckError("Could not verify user roles");
          
          // If there's an error and we haven't tried too many times, retry
          if (adminCheckAttempts < 2) { // Reduce from 3 to 2 to limit API calls
            const nextAttempt = adminCheckAttempts + 1;
            setAdminCheckAttempts(nextAttempt);
            console.log(`Retrying admin check (attempt ${nextAttempt} of 2)...`);
            
            // Retry with exponential backoff - longer delay: 600ms, then 2400ms
            const delay = Math.pow(4, nextAttempt) * 150;
            
            // Clear any existing timeout to prevent multiple timers
            if (timeoutId) {
              window.clearTimeout(timeoutId);
            }
            
            timeoutId = window.setTimeout(() => {
              if (isMounted) {
                setRoleCheckError(null);
                checkRoles();
              }
            }, delay);
          } else {
            // If we've exceeded retry attempts, keep the current admin button state
            // rather than changing it based on failed checks
            toast.error("Failed to check admin status", { 
              description: "Please refresh the page or try again later",
              id: "admin-check-error" // Prevent duplicate toasts
            });
            setIsCheckingRoles(false);
          }
        }
      }
    };
    
    checkRoles();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [session]);

  // Show admin button based on the stable state rather than the checking state
  const showAdminButton = adminButtonVisible && !isCheckingRoles;
  const showBetaBadge = isBetaTester && !isAdmin && !isCheckingRoles;

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
            {isCheckingRoles && !adminButtonVisible && (
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
              <Badge variant="outline" className="py-2 px-3">
                <Crown className="h-4 w-4 mr-1" />
                Beta Tester
              </Badge>
            )}
            
            {roleCheckError && !isCheckingRoles && !adminButtonVisible && (
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
        </div>
      </CardContent>
    </Card>
  );
}
