
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRFPUpload } from "@/hooks/use-rfp-upload";
import { UploadDropzone } from "@/components/rfp/UploadDropzone";
import { ProjectForm } from "@/components/rfp/ProjectForm";

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

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await handleFileUpload(file, deadline);
    }
  };

  const handleUpdateProject = () => {
    updateProject(projectTitle, deadline, clientName, businessName);
  };

  console.log("Rendering UploadRFP component"); // Debug log

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Upload RFP</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UploadDropzone
              onDrop={handleDrop}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
            <ProjectForm
              projectId={projectId}
              projectTitle={projectTitle}
              clientName={clientName}
              businessName={businessName}
              deadline={deadline}
              onTitleChange={setProjectTitle}
              onClientNameChange={setClientName}
              onBusinessNameChange={setBusinessName}
              onDeadlineChange={setDeadline}
              onSubmit={handleUpdateProject}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadRFP;
