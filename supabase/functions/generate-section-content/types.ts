export interface Project {
  id: string;
  title: string;
  analysis: string | null;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface GenerateContentRequest {
  projectId: string;
  sectionTitle: string;
  userId: string;
}

export interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
}