
import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { lazy, Suspense } from "react";
import { useState } from "react";
import { ProjectSidebar } from "./ProjectSidebar";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load heavy components
const RFPAnalysis = lazy(() => import("@/components/project/RFPAnalysis").then(mod => ({ default: mod.RFPAnalysis })));
const ProposalOutline = lazy(() => import("@/components/project/proposal-outline/ProposalOutline").then(mod => ({ default: mod.ProposalOutline })));
const ProposalEvaluation = lazy(() => import("@/components/project/proposal-evaluation/ProposalEvaluation").then(mod => ({ default: mod.ProposalEvaluation })));
const ProposalDraft = lazy(() => import("@/components/project/proposal-draft/ProposalDraft").then(mod => ({ default: mod.ProposalDraft })));

// Fallback loading component
const SectionLoading = () => (
  <div className="flex justify-center items-center h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface ProjectContentProps {
  project: Project;
}

export function ProjectContent({ project }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("info");
  const { hasFeature, getPlanName } = useSubscriptionFeatures();

  const renderSection = () => {
    switch (activeSection) {
      case "info":
        return <ProjectInfo project={project} />;
      case "analysis":
        return hasFeature("rfp_summary") ? (
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <RFPAnalysis filePath={project.rfp_file_path} projectId={project.project_id} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          toast.error(`This feature is only available with ${getPlanName("rfp_summary")}`)
        );
      case "outline":
        return hasFeature("proposal_outline") ? (
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <ProposalOutline projectId={project.project_id} analysis={project.analysis} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          toast.error(`This feature is only available with ${getPlanName("proposal_outline")}`)
        );
      case "draft":
        return hasFeature("proposal_draft") ? (
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <ProposalDraft 
                projectId={project.project_id} 
                mode="draft"
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          toast.error(`This feature is only available with ${getPlanName("proposal_draft")}`)
        );
      case "compiled":
        return hasFeature("compiled_draft") ? (
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <ProposalDraft 
                projectId={project.project_id}
                mode="compiled"
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          toast.error(`This feature is only available with ${getPlanName("compiled_draft")}`)
        );
      case "evaluation":
        return hasFeature("evaluation") ? (
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <ProposalEvaluation projectId={project.project_id} analysis={project.analysis} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          toast.error(`This feature is only available with ${getPlanName("evaluation")}`)
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <ProjectSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 p-6">
        <ErrorBoundary>
          {renderSection()}
        </ErrorBoundary>
      </div>
    </div>
  );
}
