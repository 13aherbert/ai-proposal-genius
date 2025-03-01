
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/knowledge-base/entry-dialog/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import type { DocumentUploadProps } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Progress } from "@/components/ui/progress";

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export function DocumentUpload({ projectId, onSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("addendum");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      .replace(/[^\x00-\x7F]/g, "")  // Remove non-ASCII characters
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  // Upload file in chunks for better performance with large files
  const uploadFileInChunks = useCallback(async (file: File, fileName: string): Promise<boolean> => {
    try {
      const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min(file.size, start + MAX_CHUNK_SIZE);
        const chunk = file.slice(start, end);
        
        const uploadOptions = {
          cacheControl: "3600",
          contentType: file.type,
          upsert: i > 0 // Only use upsert for chunks after the first
        };

        // Only use chunk naming for multi-chunk uploads
        const chunkFileName = totalChunks > 1
          ? `${fileName}.part${i+1}of${totalChunks}`
          : fileName;

        const { error } = await supabase.storage
          .from("rfp-files")
          .upload(chunkFileName, chunk, uploadOptions);

        if (error) {
          console.error(`Error uploading chunk ${i+1}:`, error);
          throw error;
        }

        // Update progress based on completed chunks
        const progress = Math.floor(((i + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      // If file was uploaded in chunks, we need to combine them
      // This is a simplified approach - in a real app, you might
      // want to implement server-side merging via an Edge Function
      if (totalChunks > 1) {
        console.log("File was uploaded in chunks. Server-side merging would be needed.");
        // Placeholder for combining file chunks via edge function
      }

      return true;
    } catch (error) {
      console.error("Chunk upload error:", error);
      return false;
    }
  }, []);

  // Helper function to upload a file as a single chunk
  const uploadSingleFile = useCallback(async (file: File, fileName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      setUploadProgress(100);
      return true;
    } catch (error) {
      console.error("Single file upload error:", error);
      return false;
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a sanitized file name
      const fileExt = selectedFile.name.split(".").pop() || "";
      const sanitizedName = sanitizeFileName(selectedFile.name.replace(`.${fileExt}`, ""));
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${projectId}/${uniqueId}-${sanitizedName}.${fileExt}`;

      // Determine if we should use chunked upload
      const isLargeFile = selectedFile.size > MAX_CHUNK_SIZE;
      const uploadSuccess = isLargeFile
        ? await uploadFileInChunks(selectedFile, fileName)
        : await uploadSingleFile(selectedFile, fileName);

      if (!uploadSuccess) {
        throw new Error("File upload failed");
      }

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
      setUploadProgress(0);
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
    <ErrorBoundary>
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
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
        
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
    </ErrorBoundary>
  );
};
