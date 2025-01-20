import { KnowledgeCategory } from "../types";

export type EntryFormData = {
  title: string;
  category: string;
  content: string;
  file?: File | null;
};

export type AddEntryDialogProps = {
  categories: KnowledgeCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type UploadMode = 'text' | 'file';