import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { BetaProgramCard } from "@/components/dashboard/BetaProgramCard";
import { SegmentedWelcome } from "@/components/dashboard/SegmentedWelcome";
import { FeatureSpotlight } from "@/components/dashboard/FeatureSpotlight";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Database, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";

export default function Dashboard() {
  const { session } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    projectCount: 0,
    knowledgeCount: 0,
    hasProjects: false,
    hasKnowledgeEntries: false
  });
  const [isNewUser, setIsNewUser] = useState(false);
  
  const { recentActivity, isLoading: activitiesLoading } = useRecentActivity(session?.user || null);

  useEffect(() => {
    if (session?.user) {
      // Check if user is new (created within last 24 hours)
      const userCreatedAt = new Date(session.user.created_at);
      const now = new Date();
      const isNew = (now.getTime() - userCreatedAt.getTime()) < 24 * 60 * 60 * 1000;
      setIsNewUser(isNew);

      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch project count
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('project_id')
        .eq('user_id', session.user.id);

      if (projectError) throw projectError;

      // Fetch knowledge entries count
      const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge_entries')
        .select('entry_id')
        .eq('user_id', session.user.id);

      if (knowledgeError) throw knowledgeError;

      setDashboardStats({
        projectCount: projects?.length || 0,
        knowledgeCount: knowledge?.length || 0,
        hasProjects: (projects?.length || 0) > 0,
        hasKnowledgeEntries: (knowledge?.length || 0) > 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const profileComplete = !!(
    profileData.first_name && 
    profileData.last_name && 
    profileData.business_name
  );

  const handleActivityClick = (activity: any) => {
    if (activity.type === 'project') {
      navigate(`/project/${activity.id}`);
    } else if (activity.type === 'knowledge') {
      navigate('/knowledge-base');
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      {/* Show segmented welcome for new users or those with minimal activity */}
      {(isNewUser || (!dashboardStats.hasProjects && !dashboardStats.hasKnowledgeEntries)) && (
        <SegmentedWelcome
          firstName={profileData.first_name}
          organizationSize={profileData.organization_size as OrganizationSize}
          useCase={profileData.use_case as UseCase}
          industry={profileData.industry}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature Spotlight for new users */}
          {isNewUser && (
            <FeatureSpotlight
              organizationSize={profileData.organization_size as OrganizationSize}
              useCase={profileData.use_case as UseCase}
            />
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              title="Upload New RFP"
              description="Start a new proposal project"
              icon={FileText}
              href="/upload-rfp"
              variant="primary"
            />
            <QuickActionCard
              title="Knowledge Base"
              description="Manage your content library"
              icon={Database}
              href="/knowledge-base"
              variant="secondary"
            />
            {(profileData.organization_size === 'small_team' || profileData.organization_size === 'enterprise') && (
              <>
                <QuickActionCard
                  title="Team Collaboration"
                  description="Work with your team"
                  icon={Users}
                  href="/projects"
                  variant="secondary"
                />
                <QuickActionCard
                  title="Analytics"
                  description="Track your success"
                  icon={BarChart3}
                  href="/projects"
                  variant="secondary"
                />
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <RecentActivityList 
              activities={recentActivity}
              isLoading={activitiesLoading}
              onActivityClick={handleActivityClick}
            />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Onboarding Progress */}
          <OnboardingProgress
            organizationSize={profileData.organization_size as OrganizationSize}
            useCase={profileData.use_case as UseCase}
            hasProjects={dashboardStats.hasProjects}
            hasKnowledgeEntries={dashboardStats.hasKnowledgeEntries}
            profileComplete={profileComplete}
          />

          {/* Beta Program Card - Show for all users but customize message */}
          <BetaProgramCard />
        </div>
      </div>
    </div>
  );
}
