import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/knowledge-base/entry-dialog/FileUpload";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/hooks/use-project-details";
import { useAuth } from "@/components/AuthProvider";

interface DocumentViewerProps {
  filePath: string;
  project: Project;
}

interface ProjectDocument {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  created_at: string;
}

export function DocumentViewer({ filePath, project }: DocumentViewerProps) {
  const { toast: uiToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("addendum");
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: documents } = useQuery({
    queryKey: ["project-documents", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${project.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("rfp-files")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("project_documents")
        .insert({
          project_id: project.id,
          file_path: fileName,
          file_name: selectedFile.name,
          document_type: documentType,
          user_id: session.user.id,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["project-documents", project.id] });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleDelete = async (document: ProjectDocument) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("rfp-files")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;

      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["project-documents", project.id] });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleViewDocument = async (documentPath: string) => {
    if (!documentPath) {
      uiToast({
        variant: "destructive",
        title: "Error",
        description: "No document found",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('rfp-files')
        .download(documentPath);

      if (error) {
        throw error;
      }

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      uiToast({
        variant: "destructive",
        title: "Error",
        description: "Could not access the file",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Document</CardTitle>
        <CardDescription>Access the original RFP document and additional files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          variant="outline"
          onClick={() => handleViewDocument(filePath)}
        >
          View RFP Document
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Additional Document</DialogTitle>
              <DialogDescription>
                Upload addendums and other project documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
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
          </DialogContent>
        </Dialog>

        {documents && documents.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Additional Documents</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {doc.document_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc.file_path)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}