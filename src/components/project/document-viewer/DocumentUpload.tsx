import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/knowledge-base/entry-dialog/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import type { DocumentUploadProps } from "./types";

export function DocumentUpload({ projectId, onSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("addendum");
  const { session } = useAuth();

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, selectedFile);

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
      toast.error("Failed to upload document");
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
      <div className="flex gap-4">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
        >
          <option value="addendum">Addendum</option>
          <option value="form">Form</option>
          <option value="other">Other</option>
        </select>
        <Button onClick={handleUpload} disabled={!selectedFile}>
          Upload
        </Button>
      </div>
    </div>
  );
}