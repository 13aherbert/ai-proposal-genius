import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { OnboardingProgress } from "@/components/dashboard/OnboardingProgress";
import { QuickUploadZone } from "@/components/dashboard/QuickUploadZone";
import { QuickUploadModal } from "@/components/rfp/QuickUploadModal";
import { KnowledgeBaseReadiness } from "@/components/dashboard/KnowledgeBaseReadiness";
import { KnowledgeSetupWizard } from "@/components/knowledge-base/KnowledgeSetupWizard";
import { FirstRFPWizard } from "@/components/onboarding/FirstRFPWizard";
import { useQuickUpload } from "@/hooks/use-quick-upload";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useKnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import { supabase } from "@/integrations/supabase/client";
import { Database, FolderOpen, Search, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";

import { EnterpriseOnboarding } from "@/components/organization/EnterpriseOnboarding";
import { EnterpriseGettingStarted } from "@/components/organization/EnterpriseGettingStarted";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { CSMContactWidget } from "@/components/dashboard/CSMContactWidget";
import { ProgressiveOnboarding } from "@/components/onboarding/ProgressiveOnboarding";
import { OnboardingResumeBanner } from "@/components/onboarding/OnboardingResumeBanner";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";

import { useSubscription } from "@/hooks/use-subscription";
import { normalizePlanType } from "@/hooks/subscription/feature-access";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { UsageProgressWidget } from "@/components/subscription/UsageProgressWidget";
import { DashboardUpgradeBanner } from "@/components/subscription/DashboardUpgradeBanner";
import { ProductTour } from "@/components/tour/ProductTour";

export default function Dashboard() {
  const { session } = useAuth();
  useSEO({ title: "Dashboard | OptiRFP", description: "Manage your RFP projects and proposals." });
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    projectCount: 0,
    knowledgeCount: 0,
    hasProjects: false,
    hasKnowledgeEntries: false
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const { recentActivity, isLoading: activitiesLoading } = useRecentActivity(session?.user || null);
  const { organization } = useCurrentOrganization();
  const knowledgeReadiness = useKnowledgeReadiness();
  const [showKBWizard, setShowKBWizard] = useState(false);
  const [showFirstRFPWizard, setShowFirstRFPWizard] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem('onboarding_checklist_dismissed') === 'true'
  );
  const { data: subscriptionData } = useSubscription();
  const planType = normalizePlanType(subscriptionData?.plan_type);
  const { getProjectLimit, hasFeature } = useSubscriptionFeatures();
  const hasOpportunities = hasFeature('opportunity_search');
  const projectLimit = getProjectLimit();
  const quickUpload = useQuickUpload();
  const onboarding = useOnboardingFlow();

  // Listen for reopen-onboarding event from Navbar
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('optirfp_wizard_skipped');
      localStorage.removeItem('optirfp_first_rfp_complete');
      onboarding.reopen();
    };
    window.addEventListener('reopen-onboarding', handler);
    return () => window.removeEventListener('reopen-onboarding', handler);
  }, [onboarding.reopen]);

  // Show KB wizard for users with empty knowledge base who haven't dismissed it
  useEffect(() => {
    if (knowledgeReadiness.isLoading) return;
    if (knowledgeReadiness.missingEssential.length === 0) return;
    if (knowledgeReadiness.isEmpty && !localStorage.getItem('kb_wizard_seen') && !dashboardStats.hasProjects) {
      setShowKBWizard(true);
    }
  }, [knowledgeReadiness.isLoading, knowledgeReadiness.isEmpty, knowledgeReadiness.missingEssential, dashboardStats.hasProjects]);

  // FirstRFPWizard is no longer auto-opened. It is launched only from the
  // empty-state CTA. The DB-backed `useOnboardingFlow` (ProgressiveOnboarding)
  // is the single source of truth for first-run prompts, so users who skip
  // never see another welcome modal on subsequent logins.

  const handleKBWizardClose = (open: boolean) => {
    setShowKBWizard(open);
    if (!open) {
      localStorage.setItem('kb_wizard_seen', 'true');
    }
  };

  useEffect(() => {
    if (session?.user) {
      const userCreatedAt = new Date(session.user.created_at);
      const now = new Date();
      const isNew = now.getTime() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000;
      setIsNewUser(isNew);

      const tutorialCompleted = localStorage.getItem('tutorial_completed') === 'true';
      setHasCompletedTutorial(tutorialCompleted);
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: projects, error: projectError } = await supabase
        .from('projects').select('project_id').eq('user_id', session.user.id);
      if (projectError) throw projectError;

      const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge_entries').select('entry_id').eq('user_id', session.user.id);
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
      navigate(`/projects/${activity.id}`);
    } else if (activity.type === 'knowledge') {
      navigate('/knowledge-base');
    }
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setHasCompletedTutorial(true);
  };

  const isEnterprise = organization?.subscription_tier === 'enterprise';
  const isEstablished = dashboardStats.hasProjects || dashboardStats.hasKnowledgeEntries;
  const showSidebar = !isEstablished || (knowledgeReadiness.missingEssential.length > 0 && !knowledgeReadiness.isLoading);

  return (
    <div className="space-y-6">

      <div data-tour="dashboard-header">
        <DashboardHeader />
      </div>

      {/* Product Tour */}
      <ProductTour />

      {/* Progressive Onboarding Wizard */}
      <ProgressiveOnboarding
        isOpen={onboarding.isOpen}
        currentStep={onboarding.currentStep}
        onNext={onboarding.next}
        onBack={onboarding.back}
        onSkip={onboarding.skip}
        onComplete={onboarding.complete}
        goToStep={onboarding.goToStep}
        setIsOpen={onboarding.setIsOpen}
      />

      {/* Resume Banner for skipped onboarding */}
      {onboarding.showBanner && (
        <OnboardingResumeBanner
          currentStep={onboarding.currentStep}
          onResume={onboarding.resume}
          onDismiss={onboarding.dismiss}
        />
      )}

      {/* Enterprise Onboarding - Show only for genuinely new enterprise users who haven't dismissed */}
      {isEnterprise && isNewUser && !localStorage.getItem('enterprise-onboarding-skipped') && (
        <EnterpriseOnboarding />
      )}

      {/* Enterprise Getting Started - Show for enterprise users */}
      {isEnterprise && !isNewUser && (
        <EnterpriseGettingStarted />
      )}

      {/* Empty state for new users */}
      {!isEstablished && !isEnterprise && !checklistDismissed && (
        <DashboardEmptyState
          profileComplete={profileComplete}
          hasKnowledgeEntries={dashboardStats.hasKnowledgeEntries}
          hasProjects={dashboardStats.hasProjects}
          knowledgeReadiness={knowledgeReadiness}
          onUploadClick={quickUpload.openModal}
          onWizardOpen={() => setShowFirstRFPWizard(true)}
          onDismiss={() => {
            setChecklistDismissed(true);
            localStorage.setItem('onboarding_checklist_dismissed', 'true');
          }}
        />
      )}

      {/* First RFP Wizard */}
      <FirstRFPWizard open={showFirstRFPWizard} onOpenChange={setShowFirstRFPWizard} />

      {/* Knowledge Base Setup Wizard */}
      {showKBWizard && (
        <KnowledgeSetupWizard open={showKBWizard} onOpenChange={handleKBWizardClose} />
      )}

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

      {/* Main content for established users */}
      {isEstablished && (
      <div className={showSidebar ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : ""}>
        <div className={showSidebar ? "lg:col-span-3 space-y-6" : "space-y-6"}>
          {/* Quick Actions */}
          <div data-tour="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div data-tour="quick-upload">
              <QuickUploadZone onFileSelect={(file) => {
                quickUpload.openModal();
                setTimeout(() => quickUpload.uploadAndCreate(file), 100);
              }} />
            </div>
            <QuickActionCard title="View All Projects" description="Manage your existing projects" icon={FolderOpen} href="/projects" variant="secondary" />
            <QuickActionCard title="Knowledge Base" description="Manage your content library" icon={Database} href="/knowledge-base" variant="secondary" />
            {hasOpportunities ? (
              <QuickActionCard title="Find Opportunities" description="Search government RFPs" icon={Search} href="/opportunities" variant="secondary" />
            ) : (
              <FeatureGate feature="opportunity_search" label="Pro">
                <QuickActionCard title="Find Opportunities" description="Search government RFPs" icon={Search} href="/opportunities" variant="secondary" />
              </FeatureGate>
            )}
          </div>

          {/* Usage Progress */}
          <div data-tour="usage-widget">
          {!isEnterprise && (
            <UsageProgressWidget
              projectCount={dashboardStats.projectCount}
              projectLimit={projectLimit}
              currentPlan={planType as "starter" | "growth" | "business" | "enterprise"}
            />
          )}
          {isEnterprise && (
            <UsageProgressWidget
              projectCount={dashboardStats.projectCount}
              projectLimit={-1}
              currentPlan="enterprise"
            />
          )}
          </div>
          {/* Upgrade Banner for Free Tier */}
          <DashboardUpgradeBanner />

          {/* Recent Activity */}
          <div data-tour="recent-activity" className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            <RecentActivityList activities={recentActivity} isLoading={activitiesLoading} onActivityClick={handleActivityClick} />
          </div>
        </div>

        {/* Sidebar - only renders when there's content to show */}
        {showSidebar && (
          <div className="space-y-4">
            <CSMContactWidget />
            {knowledgeReadiness.missingEssential.length > 0 && !knowledgeReadiness.isLoading && (
              <KnowledgeBaseReadiness compact />
            )}
            <OnboardingProgress
              organizationSize={profileData.organization_size as OrganizationSize}
              useCase={profileData.use_case as UseCase}
              hasProjects={dashboardStats.hasProjects}
              hasKnowledgeEntries={dashboardStats.hasKnowledgeEntries}
              profileComplete={profileComplete}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
}
