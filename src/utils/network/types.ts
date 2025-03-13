
/**
 * Response type for Supabase Edge Functions
 */
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    details?: any;
  } | null;
  timestamp?: number;
}
