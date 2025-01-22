/**
 * Represents the request body structure for RFP analysis
 */
export interface AnalyzeRequest {
  filePath: string;
  projectId: string;
}

/**
 * Represents project information retrieved from the database
 */
export interface ProjectInfo {
  business_name?: string;
  client_name?: string;
  title: string;
}

/**
 * Represents a knowledge base entry from the database
 */
export interface KnowledgeEntry {
  category: string;
  title: string;
}

/**
 * Represents the successful response structure
 */
export interface ApiResponse {
  analysis: string;
}

/**
 * Represents the error response structure
 */
export interface ApiError {
  error: string;
  details?: string;
}