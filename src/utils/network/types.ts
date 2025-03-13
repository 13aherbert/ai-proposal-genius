
/**
 * Type definitions for network-related utilities
 */

/**
 * Response from an edge function
 */
export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    [key: string]: any;
  };
  status?: number;
}
