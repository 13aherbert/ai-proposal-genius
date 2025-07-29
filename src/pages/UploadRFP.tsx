import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, memo, useEffect, useRef } from "react";
import { useRFPUpload } from "@/hooks/use-rfp-upload";
import { UploadDropzone } from "@/components/rfp/UploadDropzone";
import { ProjectForm } from "@/components/rfp/ProjectForm";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/components/AuthProvider";
import { isTrialExpired, normalizePlanType } from "@/hooks/subscription/feature-access";
import { toast } from "sonner";
import { AutomatedProposalCreation } from "@/components/project/AutomatedProposalCreation";
import { useAutomatedProposalCreation } from "@/hooks/use-automated-proposal-creation";

const MemoizedUploadDropzone = memo(UploadDropzone);

const UploadRFP = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [deadline, setDeadline] = useState<Date>();
  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const automationRef = useRef<HTMLDivElement>(null);
  
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
    updateProject,
    fetchProjectCount
  } = useRFPUpload();

  // Use automation hook when we have a project
  const automation = useAutomatedProposalCreation(
    projectId || "", 
    rfpFilePath || ""
  );

  useEffect(() => {
    if (session?.user) {
      fetchProjectCount();
    }
  }, [fetchProjectCount, session, subscription]);
  
  const planType = normalizePlanType(subscription?.plan_type);
  const isUserTrialExpired = planType === 'trial' && session?.user ? isTrialExpired(session.user) : false;
  
  useEffect(() => {
    if (!session?.user) return;
    
    const interval = setInterval(() => {
      fetchProjectCount();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [fetchProjectCount, session]);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await handleFileUpload(file, deadline);
    }
  }, [handleFileUpload, deadline]);

  const handleUpdateProject = useCallback(() => {
    updateProject(projectTitle, deadline, clientName, businessName);
  }, [updateProject, projectTitle, deadline, clientName, businessName]);

  const handleNavigateBack = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleViewProject = useCallback(() => {
    if (projectId) {
      navigate(`/project/${projectId}`);
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
    // Start the automation process
    if (projectId && rfpFilePath) {
      automation.startAutomation();
    }
    
    // Scroll to the automation section
    if (automationRef.current) {
      automationRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [projectId, rfpFilePath, automation.startAutomation]);

  const hasReachedLimit = 
    projectLimit !== null && 
    currentProjectCount !== null && 
    currentProjectCount >= projectLimit;

  const isLoading = currentProjectCount === null || subscriptionLoading;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
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
          
          {isUserTrialExpired && (
            <Card className="bg-amber-50 border-amber-300">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Your free trial has expired</p>
                    <p className="text-sm">
                      Please upgrade your subscription to continue creating new projects.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleUpgradeClick}
                    className="flex-shrink-0 bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!isLoading && hasReachedLimit && !isUserTrialExpired && (
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
            <div className="space-y-4">
              <MemoizedUploadDropzone
                onDrop={handleDrop}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                disabled={hasReachedLimit || isUserTrialExpired}
              />
              
              {projectId && rfpFilePath && !hasReachedLimit && !isUserTrialExpired && (
                <Button 
                  onClick={handleStartAutomation}
                  className="w-full flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="h-4 w-4" />
                  Start Full Automation
                </Button>
              )}
            </div>
            
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
                disabled={hasReachedLimit || isUserTrialExpired}
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
          {projectId && rfpFilePath && !hasReachedLimit && !isUserTrialExpired && (
            <div ref={automationRef} className="mt-8">
              <AutomatedProposalCreation 
                projectId={projectId} 
                filePath={rfpFilePath} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadRFP;
