import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { BetaProgramCard } from "@/components/dashboard/BetaProgramCard";
import { SegmentedWelcome } from "@/components/dashboard/SegmentedWelcome";
import { FeatureSpotlight } from "@/components/dashboard/FeatureSpotlight";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";
import { QuickUploadZone } from "@/components/dashboard/QuickUploadZone";
import { QuickUploadModal } from "@/components/rfp/QuickUploadModal";
import { useQuickUpload } from "@/hooks/use-quick-upload";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { Database, Users, BarChart3, FolderOpen, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";
import { EnterpriseOnboarding } from "@/components/organization/EnterpriseOnboarding";
import { EnterpriseGettingStarted } from "@/components/organization/EnterpriseGettingStarted";
import { useCurrentOrganization } from "@/hooks/use-current-organization";

export default function Dashboard() {
  const {
    session
  } = useAuth();
  const {
    profileData
  } = useProfile();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    projectCount: 0,
    knowledgeCount: 0,
    hasProjects: false,
    hasKnowledgeEntries: false
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const {
    recentActivity,
    isLoading: activitiesLoading
  } = useRecentActivity(session?.user || null);
  const { organization } = useCurrentOrganization();
  
  // Quick upload functionality
  const quickUpload = useQuickUpload();
  useEffect(() => {
    if (session?.user) {
      // Check if user is new (created within last 24 hours)
      const userCreatedAt = new Date(session.user.created_at);
      const now = new Date();
      const isNew = now.getTime() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000;
      setIsNewUser(isNew);

      // Check tutorial completion status
      const tutorialCompleted = localStorage.getItem('tutorial_completed') === 'true';
      setHasCompletedTutorial(tutorialCompleted);
      fetchDashboardStats();
    }
  }, [session]);
  const fetchDashboardStats = async () => {
    if (!session?.user?.id) return;
    try {
      // Fetch project count
      const {
        data: projects,
        error: projectError
      } = await supabase.from('projects').select('project_id').eq('user_id', session.user.id);
      if (projectError) throw projectError;

      // Fetch knowledge entries count
      const {
        data: knowledge,
        error: knowledgeError
      } = await supabase.from('knowledge_entries').select('entry_id').eq('user_id', session.user.id);
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
  const profileComplete = !!(profileData.first_name && profileData.last_name && profileData.business_name);
  const handleActivityClick = (activity: any) => {
    if (activity.type === 'project') {
      navigate(`/project/${activity.id}`);
    } else if (activity.type === 'knowledge') {
      navigate('/knowledge-base');
    }
  };
  const handleTutorialComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setHasCompletedTutorial(true);
  };

  // Solo user detection - show solo dashboard for individual users or new users
  const isSoloUser = profileData.organization_size === 'individual' || isNewUser && !dashboardStats.hasProjects;
  if (isSoloUser) {
    return <div className="space-y-6">
        <DashboardHeader />
        
        {/* Quick Upload Modal */}
        <QuickUploadModal
          isOpen={quickUpload.isModalOpen}
          onClose={quickUpload.closeModal}
          step={quickUpload.step}
          progress={quickUpload.progress}
          projectTitle={quickUpload.projectTitle}
          error={quickUpload.error}
          autoGenerate={quickUpload.autoGenerate}
          setAutoGenerate={quickUpload.setAutoGenerate}
          onUpload={quickUpload.uploadAndCreate}
          onViewProject={quickUpload.viewProject}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Solo User Dashboard */}
          <div className="lg:col-span-3">
            <div className="space-y-6" data-tour="solo-dashboard">
              {/* Import and use the SoloUserDashboard component */}
              <div className="space-y-6">
                {/* Quick Actions with tour targets - Full width with padding */}
                <div className="w-screen flex gap-4 justify-between px-4">
                  <div className="flex-1" data-tour="upload-rfp">
                    <QuickUploadZone onFileSelect={(file) => {
                      quickUpload.openModal();
                      // The modal will handle the rest
                      setTimeout(() => {
                        quickUpload.uploadAndCreate(file);
                      }, 100);
                    }} />
                  </div>
                  <div className="flex-1">
                    <QuickActionCard title="View All Projects" description="Manage your existing projects" icon={FolderOpen} href="/projects" variant="secondary" data-tour="projects" />
                  </div>
                  <div className="flex-1">
                    <QuickActionCard title="Knowledge Base" description="Manage your content library" icon={Database} href="/knowledge-base" variant="secondary" data-tour="knowledge-base" />
                  </div>
                </div>

                {/* Recent Activity with tour target */}
                <div className="space-y-4 ml-4" data-tour="recent-activity">
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                  <RecentActivityList activities={recentActivity} isLoading={activitiesLoading} onActivityClick={handleActivityClick} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar with reduced height */}
          <div className="space-y-4 mt-32">
            {/* Onboarding Progress */}
            <OnboardingProgress organizationSize={profileData.organization_size as OrganizationSize} useCase={profileData.use_case as UseCase} hasProjects={dashboardStats.hasProjects} hasKnowledgeEntries={dashboardStats.hasKnowledgeEntries} profileComplete={profileComplete} />

            {/* Beta Program Card */}
            <BetaProgramCard />
          </div>
        </div>
      </div>;
  }

  // Regular dashboard for team/enterprise users
  return <div className="space-y-6">
      <DashboardHeader />
      
      {/* Enterprise Onboarding - Show for new enterprise users */}
      {organization?.subscription_tier === 'enterprise' && (isNewUser || !localStorage.getItem('enterprise-onboarding-skipped')) && (
        <EnterpriseOnboarding />
      )}
      
      {/* Enterprise Getting Started - Show for enterprise users */}
      {organization?.subscription_tier === 'enterprise' && !isNewUser && (
        <EnterpriseGettingStarted />
      )}
      
      {/* Show segmented welcome for new users or those with minimal activity */}
      {(isNewUser || !dashboardStats.hasProjects && !dashboardStats.hasKnowledgeEntries) && organization?.subscription_tier !== 'enterprise' && <SegmentedWelcome firstName={profileData.first_name} organizationSize={profileData.organization_size as OrganizationSize} useCase={profileData.use_case as UseCase} industry={profileData.industry} />}

      {/* Quick Upload Modal */}
      <QuickUploadModal
        isOpen={quickUpload.isModalOpen}
        onClose={quickUpload.closeModal}
        step={quickUpload.step}
        progress={quickUpload.progress}
        projectTitle={quickUpload.projectTitle}
        error={quickUpload.error}
        autoGenerate={quickUpload.autoGenerate}
        setAutoGenerate={quickUpload.setAutoGenerate}
        onUpload={quickUpload.uploadAndCreate}
        onViewProject={quickUpload.viewProject}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Feature Spotlight for new users */}
          {isNewUser && <FeatureSpotlight organizationSize={profileData.organization_size as OrganizationSize} useCase={profileData.use_case as UseCase} />}

          {/* Quick Actions - Full width with padding */}
          <div className="w-screen flex gap-4 justify-between px-4">
            <div className="flex-1">
              <QuickUploadZone onFileSelect={(file) => {
                quickUpload.openModal();
                setTimeout(() => {
                  quickUpload.uploadAndCreate(file);
                }, 100);
              }} />
            </div>
            <div className="flex-1">
              <QuickActionCard title="View All Projects" description="Manage your existing projects" icon={FolderOpen} href="/projects" variant="secondary" />
            </div>
            <div className="flex-1">
              <QuickActionCard title="Knowledge Base" description="Manage your content library" icon={Database} href="/knowledge-base" variant="secondary" />
            </div>
            {(profileData.organization_size === 'small_team' || profileData.organization_size === 'enterprise') && <>
                <div className="flex-1">
                  <QuickActionCard title="Team Collaboration" description="Work with your team" icon={Users} href="/projects" variant="secondary" />
                </div>
                <div className="flex-1">
                  <QuickActionCard title="Analytics" description="Track your success" icon={BarChart3} href="/projects" variant="secondary" />
                </div>
              </>}
            {(profileData.organization_size === 'enterprise' || profileData.organization_size === 'white_label') && (
              <div className="flex-1">
                <QuickActionCard title="Manage Organization" description="Team, security & billing" icon={Building2} href="/organization" variant="secondary" />
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 ml-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <RecentActivityList activities={recentActivity} isLoading={activitiesLoading} onActivityClick={handleActivityClick} />
          </div>
        </div>

        {/* Right Column - Sidebar with reduced height */}
        <div className="space-y-4 mt-32">
          {/* Onboarding Progress */}
          <OnboardingProgress organizationSize={profileData.organization_size as OrganizationSize} useCase={profileData.use_case as UseCase} hasProjects={dashboardStats.hasProjects} hasKnowledgeEntries={dashboardStats.hasKnowledgeEntries} profileComplete={profileComplete} />

          {/* Beta Program Card */}
          <BetaProgramCard />
        </div>
      </div>
    </div>;
}
