
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, memo } from "react";
import { useRFPUpload } from "@/hooks/use-rfp-upload";
import { UploadDropzone } from "@/components/rfp/UploadDropzone";
import { ProjectForm } from "@/components/rfp/ProjectForm";

// Memoize the UploadDropzone component to prevent unnecessary re-renders
const MemoizedUploadDropzone = memo(UploadDropzone);

const UploadRFP = () => {
  const navigate = useNavigate();
  const [deadline, setDeadline] = useState<Date>();
  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const {
    uploadProgress,
    isUploading,
    projectId,
    projectTitle,
    setProjectTitle,
    handleFileUpload,
    updateProject,
  } = useRFPUpload();

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MemoizedUploadDropzone
              onDrop={handleDrop}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
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
              />
              
              {projectId && (
                <Button 
                  onClick={handleViewProject}
                  className="mt-2 w-full flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Project Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadRFP;
