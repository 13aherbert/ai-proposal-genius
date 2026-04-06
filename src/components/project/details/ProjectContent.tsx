
import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { ProjectSidebar } from "./ProjectSidebar";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GatedFeature } from "@/components/subscription/GatedFeature";
import { useProjectPresence } from "@/hooks/useProjectPresence";
import { PresenceAvatars } from "@/components/project/presence";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

// Lazy load heavy components
const ProposalEvaluation = lazy(() => import("@/components/project/proposal-evaluation/ProposalEvaluation").then(mod => ({ default: mod.ProposalEvaluation })));
const ProposalDesignStudio = lazy(() => import("@/components/project/design-studio/ProposalDesignStudio").then(mod => ({ default: mod.ProposalDesignStudio })));
const ReviewQueue = lazy(() => import("@/components/project/review/ReviewQueue").then(mod => ({ default: mod.ReviewQueue })));

// Import consolidated views
import { UnifiedAnalysisView } from "@/components/project/unified-analysis/UnifiedAnalysisView";
import { UnifiedProposalView } from "@/components/project/unified-proposal/UnifiedProposalView";

// Fallback loading component
const SectionLoading = () => (
  <div className="flex justify-center items-center h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface ProjectContentProps {
  project: Project;
  autoStart?: boolean;
}

export function ProjectContent({ project, autoStart }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const { isTestMode, plan } = useSubscriptionFeatures();
  const { session } = useAuth();
  const { presenceUsers } = useProjectPresence(project.project_id);

  // Get org members for presence
  const [orgId, setOrgId] = useState<string | null>(null);
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("profiles").select("current_organization_id").eq("profile_id", session.user.id).single()
      .then(({ data }) => { if (data) setOrgId(data.current_organization_id); });
  }, [session?.user?.id]);

  const { members } = useOrganizationMembers(orgId);
  const membersList = useMemo(() =>
    members.map(m => ({
      user_id: m.user_id,
      first_name: m.first_name,
      last_name: m.last_name,
      username: m.username,
      role: m.role,
      avatar_url: m.avatar_url,
    })),
    [members]
  );
  const showPresence = plan !== "starter" && members.length > 1;

  // Auto-start: navigate to analysis tab when coming from auto-fetch
  useEffect(() => {
    if (autoStart && activeSection === "overview") {
      setActiveSection("analysis");
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <ProjectInfo project={project} />;
      
      case "analysis":
        return (
          <UnifiedAnalysisView 
            projectId={project.project_id}
            filePath={project.rfp_file_path}
            analysis={project.analysis}
          />
        );
      
      case "proposal":
        return (
          <UnifiedProposalView 
            projectId={project.project_id}
            analysis={project.analysis}
            proposalOutline={project.proposal_outline}
          />
        );
      
      case "review":
        return (
          <GatedFeature
            featureName="Review & Evaluation"
            requiredTier="growth"
            description="Get AI-powered scoring and a multi-stage review pipeline for your proposals. Ensure compliance, quality, and readiness before submission."
            benefits={[
              "Multi-stage review pipeline (Draft → Review → Approved)",
              "Review checklists ensure compliance and quality",
              "Approval history with full audit trail",
              "Section-by-section reviewer assignment",
            ]}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <div className="space-y-6">
                  <ReviewQueue projectId={project.project_id} members={membersList} />
                  <ProposalEvaluation projectId={project.project_id} analysis={project.analysis} />
                </div>
              </Suspense>
            </ErrorBoundary>
          </GatedFeature>
        );

      case "design":
        return (
          <GatedFeature
            featureName="Design Studio"
            requiredTier="business"
            description="Create visually stunning, branded proposals with a drag-and-drop editor. Export print-ready documents that win."
            benefits={[
              "8+ professional proposal templates",
              "Brand customization (logo, colors, fonts)",
              "Cover page designer with dynamic fields",
              "Live WYSIWYG preview of final output",
            ]}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalDesignStudio projectId={project.project_id} />
              </Suspense>
            </ErrorBoundary>
          </GatedFeature>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-8rem)]">
      <ProjectSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 p-3 sm:p-6">
        {showPresence && presenceUsers.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Online:</span>
            <PresenceAvatars presenceUsers={presenceUsers} members={membersList} />
          </div>
        )}
        {isTestMode && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-2 text-sm text-amber-700">
            Test mode active. Your subscription features are being simulated.
          </div>
        )}
        <ErrorBoundary>
          {renderSection()}
        </ErrorBoundary>
      </div>
    </div>
  );
}
