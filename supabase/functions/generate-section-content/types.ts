export interface Project {
  id: string;
  title: string;
  analysis: string | null;
  client_name: string | null;
  business_name: string | null;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string | null;
  category: string;
  parsed_content: string | null;
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