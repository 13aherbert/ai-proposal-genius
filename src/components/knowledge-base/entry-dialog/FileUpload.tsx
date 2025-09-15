import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const FileUpload = ({ onFileSelect, selectedFile }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file">Upload Document</Label>
      <div 
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Input
          id="file"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.md,.pptx,.xlsx,.xls,.ppt,.odt,.ods,.odp"
        />
        <label
          htmlFor="file"
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, RTF, CSV, MD, PPTX, XLSX, PPT, ODT (max 20MB)
          </span>
        </label>
      </div>
    </div>
  );
};