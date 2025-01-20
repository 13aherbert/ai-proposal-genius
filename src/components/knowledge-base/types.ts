import { LucideIcon } from "lucide-react";

export interface KnowledgeCategory {
  icon: React.ReactNode;
  name: string;
}

export interface KnowledgeEntry {
  title: string;
  category: string;
  updated: string;
}