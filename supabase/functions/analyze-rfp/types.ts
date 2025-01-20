export interface ProjectInfo {
  business_name?: string;
  client_name?: string;
  title: string;
}

export interface KnowledgeEntry {
  category: string;
  title: string;
}

export interface AnalyzeRequest {
  filePath: string;
  projectId: string;
}

export interface ApiResponse {
  analysis: string;
}

export interface ApiError {
  error: string;
  details?: string;
}