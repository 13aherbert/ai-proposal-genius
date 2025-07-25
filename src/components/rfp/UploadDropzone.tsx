
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertTriangle, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { validateFile } from "@/utils/security/input-sanitizer";

interface UploadDropzoneProps {
  onDrop: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
  disabled?: boolean;
}

export const UploadDropzone = ({ 
  onDrop, 
  isUploading, 
  uploadProgress,
  disabled = false
}: UploadDropzoneProps) => {
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDropAccepted = (acceptedFiles: File[]) => {
    if (disabled) return;
    
    setFileError(null);
    
    // Enhanced security validation
    const file = acceptedFiles[0];
    const allowedTypes = [
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validation = validateFile(file, allowedTypes);
    if (!validation.isValid) {
      setFileError(validation.errors[0]);
      return;
    }
    
    // Additional content-based validation
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      setFileError('Invalid file name');
      return;
    }
    
    setDraggedFile(file);
    onDrop(acceptedFiles);
  };

  const onDropRejected = (fileRejections: any) => {
    if (disabled) return;
    
    const rejection = fileRejections[0];
    if (rejection) {
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setFileError("File is too large. Maximum file size is 20MB.");
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setFileError("Invalid file type. Please upload a PDF or Word document.");
      } else {
        setFileError("Invalid file. Please try a different file.");
      }
    }
  };

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject 
  } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading
  });

  // Reset file error after 5 seconds
  useEffect(() => {
    if (fileError) {
      const timer = setTimeout(() => {
        setFileError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fileError]);

  // Clear dragged file reference after successful upload
  useEffect(() => {
    if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setDraggedFile(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  return (
    <ErrorBoundary>
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
              disabled 
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : isDragReject
                  ? "border-red-500 bg-red-50"
                  : isDragAccept
                    ? "border-green-500 bg-green-50"
                    : isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} disabled={disabled || isUploading} />
            {disabled ? (
              <div className="py-4 opacity-60">
                <Lock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p>Project limit reached</p>
                <p className="text-sm text-muted-foreground">
                  Delete some projects or upgrade your plan to continue
                </p>
              </div>
            ) : !isDragActive && !draggedFile && !isUploading ? (
              <>
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p>Drag and drop your RFP file here, or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX (max 20MB)
                  </p>
                </div>
              </>
            ) : isDragActive ? (
              <div className="py-4">
                <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragReject ? "text-red-500" : "text-primary"}`} />
                <p>{isDragReject ? "This file type is not supported" : "Drop the file here..."}</p>
              </div>
            ) : draggedFile && !isUploading ? (
              <div className="py-4">
                <Upload className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">{draggedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(draggedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : null}
          </div>

          {fileError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span>{fileError}</span>
            </div>
          )}

          {isUploading && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between mb-1 text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {uploadProgress < 50 
                  ? "Preparing your file..." 
                  : uploadProgress < 80 
                    ? "Processing file..."
                    : "Almost done..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
