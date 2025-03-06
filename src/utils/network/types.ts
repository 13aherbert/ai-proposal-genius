
// Type definition for API responses from Edge Functions
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    details?: string;
    statusCode?: number;
  };
  success?: boolean;
}
