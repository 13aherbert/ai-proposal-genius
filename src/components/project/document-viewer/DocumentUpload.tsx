
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/knowledge-base/entry-dialog/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import type { DocumentUploadProps } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DocumentUpload({ projectId, onSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("addendum");
  const [isUploading, setIsUploading] = useState(false);
  const { session } = useAuth();

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, Word, or text document."
      });
      return false;
    }
    
    return true;
  };

  // Validate file size
  const validateFileSize = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Maximum file size is 10MB."
      });
      return false;
    }
    
    return true;
  };

  // Validate file name
  const validateFileName = (file: File): boolean => {
    const maxLength = 255;
    if (file.name.length > maxLength) {
      toast.error("File name too long", {
        description: `Maximum file name length is ${maxLength} characters.`
      });
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (validateFileType(file) && validateFileSize(file) && validateFileName(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove any potentially problematic characters
    return fileName
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a sanitized file name
      const fileExt = selectedFile.name.split(".").pop() || "";
      const sanitizedName = sanitizeFileName(selectedFile.name.replace(`.${fileExt}`, ""));
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${projectId}/${uniqueId}-${sanitizedName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          contentType: selectedFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("project_documents")
        .insert({
          project_id: projectId,
          file_path: fileName,
          file_name: selectedFile.name,
          document_type: documentType,
          user_id: session.user.id,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document", {
        description: error instanceof Error ? error.message : "Please try again later."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document-type">Document Type</Label>
        <Select
          value={documentType}
          onValueChange={setDocumentType}
        >
          <SelectTrigger id="document-type" className="w-full">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="addendum">Addendum</SelectItem>
            <SelectItem value="form">Form</SelectItem>
            <SelectItem value="specification">Specification</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <FileUpload 
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>
    </div>
  );
}
