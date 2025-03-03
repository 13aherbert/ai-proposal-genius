
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { adminService } from "@/services/AdminService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, Users } from "lucide-react";

export default function DashboardHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { plan, getProjectLimit, isLoading, error } = useSubscriptionFeatures();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const projectLimit = getProjectLimit();
  const isSubscriptionActive = plan && plan !== 'trial';
  
  useEffect(() => {
    const checkRoles = async () => {
      if (session?.user) {
        const adminCheck = await adminService.isAdmin();
        setIsAdmin(adminCheck);
        
        const betaCheck = await adminService.checkUserRole('beta_tester');
        setIsBetaTester(betaCheck);
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
          
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                className="bg-black/20 border-brand-silver hover:bg-black/40"
                onClick={() => navigate('/admin')}
              >
                <Users className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            
            {isBetaTester && !isAdmin && (
              <Badge variant="outline" className="py-2 px-3">
                <Crown className="h-3 w-3 mr-1" />
                Beta Tester
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              className="bg-black/20 border-brand-silver hover:bg-black/40"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
