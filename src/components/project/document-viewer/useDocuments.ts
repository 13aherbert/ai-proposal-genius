import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProjectDocument } from "./types";

export function useDocuments(projectId: string) {
  const queryClient = useQueryClient();

  const { data: documents } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleView = async (documentPath: string) => {
    if (!documentPath) {
      toast.error("No document found");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("rfp-files")
        .download(documentPath);

      if (error) throw error;

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view document");
    }
  };

  return {
    documents,
    handleDelete,
    handleView,
  };
}