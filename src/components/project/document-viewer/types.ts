import type { Project } from "@/hooks/use-project-details";

export interface ProjectDocument {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  created_at: string;
}

export interface DocumentViewerProps {
  filePath: string;
  project: Project;
}

export interface DocumentListProps {
  documents: ProjectDocument[];
  onView: (path: string) => void;
  onDelete: (doc: ProjectDocument) => void;
}

export interface DocumentUploadProps {
  projectId: string;
  onSuccess: () => void;
}