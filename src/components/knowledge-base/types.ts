import { LucideIcon } from "lucide-react";

export interface KnowledgeCategory {
  icon: React.ReactNode;
  name: string;
}

export interface KnowledgeEntry {
  title: string;
  category: string;
  updated: string;
  isTemplate?: boolean;
  /** Raw ISO timestamp for updated_at */
  updatedAt?: string;
  /** Raw ISO timestamp for created_at */
  createdAt?: string;
}
