import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback, memo, useEffect, useRef } from "react";
import { useRFPUpload } from "@/hooks/use-rfp-upload";
import { UploadDropzone } from "@/components/rfp/UploadDropzone";
import { UrlInput } from "@/components/rfp/UrlInput";
import { ProjectForm } from "@/components/rfp/ProjectForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/components/AuthProvider";
import { normalizePlanType } from "@/hooks/subscription/feature-access";
import { toast } from "sonner";
import AutomatedProposalCreation, { type AutomatedProposalCreationRef } from "@/components/project/AutomatedProposalCreation";
import { UpgradeGateModal } from "@/components/subscription/UpgradeGateModal";
import { useSEO } from "@/hooks/use-seo";

const MemoizedUploadDropzone = memo(UploadDropzone);

const UploadRFP = () => {
  useSEO({
    noindex: true, title: "Upload RFP — OptiRFP", description: "Upload an RFP document or paste a URL to start a new AI-drafted proposal." });
  const navigate = useNavigate();
  const location = useLocation();
  const prefillState = location.state as {
    prefillTitle?: string;
    prefillDeadline?: string;
    prefillAgency?: string;
  } | null;

  const { session } = useAuth();
  const { data: subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [deadline, setDeadline] = useState<Date>(() => {
    if (prefillState?.prefillDeadline) {
      try { return new Date(prefillState.prefillDeadline); } catch { return undefined as any; }
    }
    return undefined as any;
  });
  const [clientName, setClientName] = useState(prefillState?.prefillAgency || "");
  const [businessName, setBusinessName] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(() => {
    return localStorage.getItem('auto-generate-preference') !== 'false';
  });
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const automationRef = useRef<HTMLDivElement>(null);
  const automationComponentRef = useRef<AutomatedProposalCreationRef>(null);
  
  const {
    uploadProgress,
    isUploading,
    projectId,
    projectTitle,
    rfpFilePath,
    projectLimit,
    currentProjectCount,
    fetchError,
    isRefreshing,
    setProjectTitle,
    handleFileUpload,
    handleUrlUpload,
    updateProject,
    fetchProjectCount
  } = useRFPUpload();

  // Apply prefill from location.state (e.g., from Opportunity Finder)
  useEffect(() => {
    if (prefillState?.prefillTitle && !projectTitle) {
      setProjectTitle(prefillState.prefillTitle);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session?.user) {
      fetchProjectCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const planType = normalizePlanType(subscription?.plan_type);

  // Calculate limits early so they can be used in effects
  const hasReachedLimit =
    projectLimit !== null &&
    currentProjectCount !== null &&
    currentProjectCount >= projectLimit;

  // Only show the loading wheel during the initial load — once we have a
  // project count, background subscription refreshes shouldn't flash the spinner.
  const isLoading = currentProjectCount === null && subscriptionLoading;

  // Route-level gate: show upgrade modal if at limit and no project created yet
  useEffect(() => {
    if (!isLoading && hasReachedLimit && !projectId) {
      setShowUpgradeGate(true);
    }
  }, [isLoading, hasReachedLimit, projectId]);

  // Save auto-generate preference to localStorage
  const handleAutoGenerateChange = useCallback((value: boolean) => {
    setAutoGenerate(value);
    localStorage.setItem('auto-generate-preference', value.toString());
  }, []);

  // Auto-start automation when project is created and autoGenerate is enabled
  useEffect(() => {
    if (
      projectId && 
      rfpFilePath && 
      autoGenerate && 
      !hasAutoStarted &&
      !hasReachedLimit
    ) {
      // Mark as started to prevent multiple triggers
      setHasAutoStarted(true);
      
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        if (automationComponentRef.current) {
          automationComponentRef.current.startAutomation();
        }
        
        // Scroll to the automation section
        if (automationRef.current) {
          automationRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [projectId, rfpFilePath, autoGenerate, hasAutoStarted, hasReachedLimit]);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await handleFileUpload(file, deadline);
    }
  }, [handleFileUpload, deadline]);

  const handleUrlSubmit = useCallback(async (url: string) => {
    await handleUrlUpload(url, deadline);
  }, [handleUrlUpload, deadline]);

  const handleUpdateProject = useCallback(() => {
    updateProject(projectTitle, deadline, clientName, businessName);
  }, [updateProject, projectTitle, deadline, clientName, businessName]);

  const handleNavigateBack = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleViewProject = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  }, [navigate, projectId]);
  
  const handleRefreshSubscription = useCallback(() => {
    toast.info("Refreshing subscription data...");
    refreshSubscription();
    fetchProjectCount();
  }, [refreshSubscription, fetchProjectCount]);

  const handleUpgradeClick = useCallback(() => {
    navigate('/subscription', { state: { fromTrialExpired: true } });
  }, [navigate]);

  const handleStartAutomation = useCallback(() => {
    // Start the automation process through the component ref
    if (automationComponentRef.current) {
      automationComponentRef.current.startAutomation();
    }
    
    // Scroll to the automation section
    if (automationRef.current) {
      automationRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
          <header className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigateBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Upload RFP</h1>
          </header>
          
          
          {!isLoading && hasReachedLimit && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Project limit reached</p>
                    <p className="text-sm">
                      You have reached your plan's limit of {projectLimit} projects. 
                      Please delete some projects or upgrade your plan to continue.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefreshSubscription}
                    className="flex-shrink-0"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && projectLimit !== null && currentProjectCount !== null && (
            <div className="text-sm text-muted-foreground">
              Project usage: {currentProjectCount} of {projectLimit} projects
              {planType && (
                <span className="ml-2 text-brand-green">
                  ({planType.charAt(0).toUpperCase() + planType.slice(1)} plan)
                </span>
              )}
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-muted-foreground flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading subscription data...
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="url">Paste URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <MemoizedUploadDropzone
                  onDrop={handleDrop}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  disabled={hasReachedLimit}
                />
              </TabsContent>
              <TabsContent value="url">
                <UrlInput
                  onSubmit={handleUrlSubmit}
                  isProcessing={isUploading}
                  uploadProgress={uploadProgress}
                  disabled={hasReachedLimit}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex flex-col gap-6">
              <ProjectForm
                projectTitle={projectTitle}
                setProjectTitle={setProjectTitle}
                deadline={deadline}
                setDeadline={setDeadline}
                clientName={clientName}
                setClientName={setClientName}
                businessName={businessName}
                setBusinessName={setBusinessName}
                onSubmit={handleUpdateProject}
                isProcessing={isUploading}
                disabled={hasReachedLimit}
                autoGenerate={autoGenerate}
                setAutoGenerate={handleAutoGenerateChange}
              />
              
              {projectId && (
                <Button 
                  onClick={handleViewProject}
                  className="mt-2 w-full flex items-center gap-2"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Project Details
                </Button>
              )}
            </div>
          </div>

          {/* Automated Proposal Creation */}
          {projectId && rfpFilePath && !hasReachedLimit && (
            <div ref={automationRef} className="mt-8">
              <AutomatedProposalCreation 
                ref={automationComponentRef}
                projectId={projectId} 
                filePath={rfpFilePath} 
              />
            </div>
          )}
      <UpgradeGateModal
        open={showUpgradeGate}
        onOpenChange={setShowUpgradeGate}
        currentLimit={projectLimit ?? 3}
      />
    </div>
  );
};

export default UploadRFP;
