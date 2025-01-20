import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const UploadRFP = () => {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const { session } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !session?.user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create a sanitized filename
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Create a readable stream from the file
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const fileData = new Uint8Array(arrayBuffer);

        // Upload file to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('rfp-files')
          .upload(sanitizedFileName, fileData, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Create a new project
        const { error: projectError, data: projectData } = await supabase
          .from('projects')
          .insert({
            title: file.name.replace(`.${fileExt}`, ''),
            rfp_file_path: sanitizedFileName,
            user_id: session.user.id,
            deadline: deadline?.toISOString(),
          })
          .select()
          .single();

        if (projectError) {
          // If project creation fails, delete the uploaded file
          await supabase.storage
            .from('rfp-files')
            .remove([sanitizedFileName]);
          throw projectError;
        }

        setProjectId(projectData.id);
        setProjectTitle(projectData.title);
        setUploadProgress(100);
        toast.success("Project created successfully!");
        
        // Reset the upload state after a short delay to show 100%
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      };

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to create project. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [session, deadline]);

  const handleUpdateProject = async () => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          title: projectTitle,
          deadline: deadline?.toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Failed to update project. Please try again.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB max file size
  });

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
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p>Drop the file here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p>Drag and drop your RFP file here, or click to select</p>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX (max 20MB)
                      </p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-6 space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                {projectId ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectTitle">Project Title</Label>
                      <Input
                        id="projectTitle"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Enter project title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadline}
                            onSelect={setDeadline}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button onClick={handleUpdateProject}>Update Project</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Upload an RFP document to begin. Once uploaded, you'll be able to
                      enter project details and start the AI analysis.
                    </p>
                    <div className="space-y-2">
                      <Label>Deadline (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadline}
                            onSelect={setDeadline}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadRFP;