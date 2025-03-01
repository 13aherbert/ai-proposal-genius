
import { Project } from "@/hooks/use-project-details";
import { ProjectInfo } from "@/components/project/ProjectInfo";
import { lazy, Suspense, useState, useEffect } from "react";
import { ProjectSidebar } from "./ProjectSidebar";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

// Feature locked component
const FeatureLocked = ({ 
  featureName, 
  planName 
}: { 
  featureName: string;
  planName: string;
}) => {
  const navigate = useNavigate();
  
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="text-center pb-2">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <CardTitle>Feature Not Available</CardTitle>
        <CardDescription>
          {featureName} is available with {planName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <Button 
          onClick={() => navigate('/subscription')}
          className="mt-2"
        >
          Upgrade Subscription
        </Button>
      </CardContent>
    </Card>
  );
};

interface ProjectContentProps {
  project: Project;
}

export function ProjectContent({ project }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("info");
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const { hasFeature, getPlanName, isTestMode } = useSubscriptionFeatures();
  const navigate = useNavigate();

  // Clear shown toasts when active section changes
  useEffect(() => {
    setShownToasts(new Set());
  }, [activeSection]);

  const showFeatureToast = (feature: string) => {
    // Only show toast once per session
    if (!shownToasts.has(feature)) {
      toast.error(`This feature requires a subscription upgrade`, {
        description: "Visit the subscription page to learn more",
        action: {
          label: "Upgrade",
          onClick: () => navigate('/subscription')
        }
      });
      setShownToasts(prev => new Set([...prev, feature]));
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "info":
        return <ProjectInfo project={project} />;
      
      case "analysis":
        if (hasFeature("rfp_summary")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <RFPAnalysis filePath={project.rfp_file_path} projectId={project.project_id} />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          showFeatureToast("rfp_summary");
          return <FeatureLocked featureName="RFP Analysis" planName={getPlanName("rfp_summary")} />;
        }
      
      case "outline":
        if (hasFeature("proposal_outline")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalOutline projectId={project.project_id} analysis={project.analysis} />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          showFeatureToast("proposal_outline");
          return <FeatureLocked featureName="Proposal Outline" planName={getPlanName("proposal_outline")} />;
        }
      
      case "draft":
        if (hasFeature("proposal_draft")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalDraft 
                  projectId={project.project_id} 
                  mode="draft"
                />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          showFeatureToast("proposal_draft");
          return <FeatureLocked featureName="Proposal Draft" planName={getPlanName("proposal_draft")} />;
        }
      
      case "compiled":
        if (hasFeature("compiled_draft")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalDraft 
                  projectId={project.project_id}
                  mode="compiled"
                />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          showFeatureToast("compiled_draft");
          return <FeatureLocked featureName="Compiled Draft" planName={getPlanName("compiled_draft")} />;
        }
      
      case "evaluation":
        if (hasFeature("evaluation")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalEvaluation projectId={project.project_id} analysis={project.analysis} />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          showFeatureToast("evaluation");
          return <FeatureLocked featureName="Proposal Evaluation" planName={getPlanName("evaluation")} />;
        }
      
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
