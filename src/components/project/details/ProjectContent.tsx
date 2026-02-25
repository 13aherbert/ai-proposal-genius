
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
const ProposalEvaluation = lazy(() => import("@/components/project/proposal-evaluation/ProposalEvaluation").then(mod => ({ default: mod.ProposalEvaluation })));
const ProposalDesignStudio = lazy(() => import("@/components/project/design-studio/ProposalDesignStudio").then(mod => ({ default: mod.ProposalDesignStudio })));

// Import consolidated views
import { UnifiedAnalysisView } from "@/components/project/unified-analysis/UnifiedAnalysisView";
import { UnifiedProposalView } from "@/components/project/unified-proposal/UnifiedProposalView";

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
  autoStart?: boolean;
}

export function ProjectContent({ project, autoStart }: ProjectContentProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const { hasFeature, getPlanName, isTestMode } = useSubscriptionFeatures();
  const navigate = useNavigate();

  // Auto-start: navigate to analysis tab when coming from auto-fetch
  useEffect(() => {
    if (autoStart && activeSection === "overview") {
      setActiveSection("analysis");
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear shown toasts when active section changes
  useEffect(() => {
    setShownToasts(new Set());
  }, [activeSection]);

  // Handle feature access checks and toasts
  useEffect(() => {
    const checkFeatureAccess = () => {
      let requiredFeature = "";
      
      switch (activeSection) {
        case "analysis":
          requiredFeature = "rfp_summary";
          break;
        case "proposal":
          requiredFeature = "proposal_draft";
          break;
        case "review":
          requiredFeature = "evaluation";
          break;
        default:
          return;
      }

      if (requiredFeature && !hasFeature(requiredFeature as any) && !shownToasts.has(requiredFeature)) {
        toast.error(`This feature requires a subscription upgrade`, {
          description: "Visit the subscription page to learn more",
          action: {
            label: "Upgrade",
            onClick: () => navigate('/subscription')
          }
        });
        setShownToasts(prev => new Set([...prev, requiredFeature]));
      }
    };

    checkFeatureAccess();
  }, [activeSection, hasFeature, shownToasts, navigate]);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <ProjectInfo project={project} />;
      
      case "analysis":
        if (hasFeature("rfp_summary")) {
          return (
            <UnifiedAnalysisView 
              projectId={project.project_id}
              filePath={project.rfp_file_path}
              analysis={project.analysis}
            />
          );
        } else {
          return <FeatureLocked featureName="Analysis" planName={getPlanName("rfp_summary")} />;
        }
      
      case "proposal":
        if (hasFeature("proposal_draft")) {
          return (
            <UnifiedProposalView 
              projectId={project.project_id}
              analysis={project.analysis}
              proposalOutline={project.proposal_outline}
            />
          );
        } else {
          return <FeatureLocked featureName="Proposal" planName={getPlanName("proposal_draft")} />;
        }
      
      case "review":
        if (hasFeature("evaluation")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalEvaluation projectId={project.project_id} analysis={project.analysis} />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          return <FeatureLocked featureName="Evaluation" planName={getPlanName("evaluation")} />;
        }

      case "design":
        if (hasFeature("proposal_draft")) {
          return (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalDesignStudio projectId={project.project_id} />
              </Suspense>
            </ErrorBoundary>
          );
        } else {
          return <FeatureLocked featureName="Design Studio" planName={getPlanName("proposal_draft")} />;
        }
      
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
