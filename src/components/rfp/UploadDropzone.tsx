import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";

interface UploadDropzoneProps {
  onDrop: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export const UploadDropzone = ({ onDrop, isUploading, uploadProgress }: UploadDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  return (
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
  );
};