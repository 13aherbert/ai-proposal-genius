import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { ProjectStageNav, StageId } from "./ProjectStageNav";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  ReviewSkeleton,
  DesignSkeleton,
} from "./SectionSkeletons";
import { GatedFeature } from "@/components/subscription/GatedFeature";
import { useProjectPresence } from "@/hooks/useProjectPresence";
import { PresenceAvatars } from "@/components/project/presence";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Lazy load heavy components
const ProposalEvaluation = lazy(() => import("@/components/project/proposal-evaluation/ProposalEvaluation").then(mod => ({ default: mod.ProposalEvaluation })));
const ProposalDesignStudio = lazy(() => import("@/components/project/design-studio/ProposalDesignStudio").then(mod => ({ default: mod.ProposalDesignStudio })));
const ReviewQueue = lazy(() => import("@/components/project/review/ReviewQueue").then(mod => ({ default: mod.ReviewQueue })));

import { UnifiedAnalysisView } from "@/components/project/unified-analysis/UnifiedAnalysisView";
import { UnifiedProposalView } from "@/components/project/unified-proposal/UnifiedProposalView";


interface ProjectContentProps {
  project: Project;
  autoStart?: boolean;
}

export function ProjectContent({ project, autoStart }: ProjectContentProps) {
  const [stage, setStage] = useState<StageId>("brief");
  const [deliverTab, setDeliverTab] = useState<"review" | "design">("review");
  const { isTestMode, plan } = useSubscriptionFeatures();
  const { presenceUsers } = useProjectPresence(project.project_id);

  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

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

  useEffect(() => {
    if (autoStart && stage === "brief") {
      setStage("analyze");
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderStage = () => {
    switch (stage) {
      case "brief":
        return <ProjectInfo project={project} />;

      case "analyze":
        return (
          <UnifiedAnalysisView
            projectId={project.project_id}
            filePath={project.rfp_file_path}
            analysis={project.analysis}
          />
        );

      case "draft":
        return (
          <UnifiedProposalView
            projectId={project.project_id}
            analysis={project.analysis}
            proposalOutline={project.proposal_outline}
          />
        );

      case "deliver":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Deliver</h2>
                <p className="text-sm text-muted-foreground">Review, design and export your proposal.</p>
              </div>
              <ToggleGroup
                type="single"
                size="sm"
                value={deliverTab}
                onValueChange={(v) => v && setDeliverTab(v as "review" | "design")}
              >
                <ToggleGroupItem value="review" className="text-xs px-3">Review</ToggleGroupItem>
                <ToggleGroupItem value="design" className="text-xs px-3">Design & Export</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {deliverTab === "review" ? (
              <GatedFeature
                featureName="Review & Evaluation"
                requiredTier="growth"
                description="AI-powered scoring and a multi-stage review pipeline. Ensure compliance, quality, and readiness before submission."
                benefits={[
                  "Multi-stage review pipeline (Draft → Review → Approved)",
                  "Review checklists for compliance and quality",
                  "Approval history with full audit trail",
                  "Section-by-section reviewer assignment",
                ]}
              >
                <ErrorBoundary>
                  <Suspense fallback={<ReviewSkeleton />}>
                    <div className="space-y-6">
                      <ReviewQueue projectId={project.project_id} members={membersList} />
                      <ProposalEvaluation projectId={project.project_id} analysis={project.analysis} />
                    </div>
                  </Suspense>
                </ErrorBoundary>
              </GatedFeature>
            ) : (
              <GatedFeature
                featureName="Design Studio"
                requiredTier="business"
                description="Create visually stunning, branded proposals with a drag-and-drop editor. Export print-ready documents."
                benefits={[
                  "8+ professional proposal templates",
                  "Brand customization (logo, colors, fonts)",
                  "Cover page designer with dynamic fields",
                  "Live WYSIWYG preview of final output",
                ]}
              >
                <ErrorBoundary>
                  <Suspense fallback={<DesignSkeleton />}>
                    <ProposalDesignStudio projectId={project.project_id} />
                  </Suspense>
                </ErrorBoundary>
              </GatedFeature>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <ProjectStageNav activeStage={stage} onChange={setStage} />
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
        {(showPresence && presenceUsers.length > 0) || isTestMode ? (
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            {showPresence && presenceUsers.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Online:</span>
                <PresenceAvatars presenceUsers={presenceUsers} members={membersList} />
              </div>
            ) : <span />}
            {isTestMode && (
              <div className="text-xs px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
                Test mode active
              </div>
            )}
          </div>
        ) : null}
        <ErrorBoundary>
          <div key={stage} className="animate-fade-in">
            {renderStage()}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
