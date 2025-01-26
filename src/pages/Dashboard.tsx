import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, FolderOpen, BookOpen, Plus, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";

type RecentActivity = {
  type: 'project' | 'knowledge';
  title: string;
  date: string;
  id: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch recent projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (projectsError) throw projectsError;

        // Fetch recent knowledge entries
        const { data: entries, error: entriesError } = await supabase
          .from('knowledge_entries')
          .select('id, title, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (entriesError) throw entriesError;

        // Combine and sort activities
        const activities: RecentActivity[] = [
          ...(projects?.map(p => ({
            type: 'project' as const,
            title: p.title,
            date: p.created_at,
            id: p.id
          })) || []),
          ...(entries?.map(e => ({
            type: 'knowledge' as const,
            title: e.title,
            date: e.created_at,
            id: e.id
          })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load recent activity"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, [session?.user?.id, toast]);

  const handleActivityClick = (activity: RecentActivity) => {
    if (activity.type === 'project') {
      navigate(`/projects/${activity.id}`);
    } else {
      navigate('/knowledge-base');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-brand-green">
              Welcome to OptiRFP
            </h1>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/account-settings")}
                className="border-brand-gray text-brand-gray hover:bg-brand-gray/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => navigate("/upload-rfp")} className="bg-brand-green text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="border-brand-gray text-brand-gray hover:bg-brand-gray/10">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              className="bg-white hover:shadow-lg transition-shadow cursor-pointer border-brand-silver"
              onClick={() => navigate("/upload-rfp")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-blue">
                  <FileUp className="h-5 w-5" />
                  Upload RFP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray">
                  Upload a new RFP document to start a new project with AI assistance
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white hover:shadow-lg transition-shadow cursor-pointer border-brand-silver"
              onClick={() => navigate("/recent-projects")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-blue">
                  <FolderOpen className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray">
                  Access and manage your existing RFP response projects
                </p>
              </CardContent>
            </Card>

            <Card
              className="bg-white hover:shadow-lg transition-shadow cursor-pointer border-brand-silver"
              onClick={() => navigate("/knowledge-base")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-blue">
                  <BookOpen className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray">
                  Manage your business knowledge base for AI-powered responses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-brand-gray mb-4">Recent Activity</h2>
            <Card className="bg-white border-brand-silver">
              <CardContent className="p-6">
                {isLoading ? (
                  <p className="text-brand-gray text-center">Loading recent activity...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="text-brand-gray text-center">No recent activity to display</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={`${activity.type}-${activity.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-brand-silver/10 cursor-pointer transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="flex items-center gap-3">
                          {activity.type === 'project' ? (
                            <FolderOpen className="h-4 w-4 text-brand-green" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-brand-green" />
                          )}
                          <div>
                            <p className="font-medium text-brand-gray">{activity.title}</p>
                            <p className="text-sm text-brand-gray/70">
                              {format(new Date(activity.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;