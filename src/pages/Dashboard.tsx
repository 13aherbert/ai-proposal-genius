
import { FileUp, FolderOpen, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradeBanner } from "@/components/subscription/UpgradeBanner";
import { BetaRoleDebugger } from "@/components/development/BetaRoleDebugger";

const Dashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { recentActivity, isLoading } = useRecentActivity(session?.user ?? null);

  const handleActivityClick = (activity: { type: 'project' | 'knowledge', id: string }) => {
    if (activity.type === 'project') {
      navigate(`/projects/${activity.id}`);
    } else {
      navigate('/knowledge-base');
    }
  };

  const quickActions = [
    {
      icon: FileUp,
      title: "Upload RFP",
      description: "Upload a new RFP document to start a new project with AI assistance",
      path: "/upload-rfp"
    },
    {
      icon: FolderOpen,
      title: "Recent Projects",
      description: "Access and manage your existing RFP response projects",
      path: "/recent-projects"
    },
    {
      icon: BookOpen,
      title: "Knowledge Base",
      description: "Manage your business knowledge base for AI-powered responses",
      path: "/knowledge-base"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-brand-green to-[#1a1a1a]">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-8">
          <UpgradeBanner />
          <DashboardHeader />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.title}
                icon={action.icon}
                title={action.title}
                description={action.description}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>

          <div className="mt-4 md:mt-8">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Recent Activity</h2>
            <Card className="bg-black/30 backdrop-blur-sm border-brand-silver">
              <CardContent className="p-4 md:p-6">
                <RecentActivityList
                  activities={recentActivity}
                  isLoading={isLoading}
                  onActivityClick={handleActivityClick}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Only show the beta role debugger in development mode */}
          {import.meta.env.DEV && (
            <div className="mt-4 md:mt-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Developer Tools</h2>
              <BetaRoleDebugger />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
