
import { KnowledgeCategory } from "../types";

export type UploadMode = 'text' | 'file';

export type EntryFormData = {
  title: string;
  category: string;
  content: string;
  uploadMode: UploadMode;
  selectedFile: File | null;
};

export type AddEntryDialogProps = {
  categories: KnowledgeCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
