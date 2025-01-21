export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set a smaller chunk size to ensure we stay within token limits
export const CHUNK_SIZE = 4000; // This ensures we stay well within the 8192 token limit
export const MAX_RETRIES = 3;
export const MAX_TOKENS = 1000;
export const RATE_LIMIT_BACKOFF = 5000;