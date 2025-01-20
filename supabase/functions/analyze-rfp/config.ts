export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const CHUNK_SIZE = 15000; // Reduced from 60000 to stay within rate limits
export const MAX_RETRIES = 3;
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const CLAUDE_MODEL = 'claude-3-opus-20240229';
export const MAX_TOKENS = 4000;
export const RATE_LIMIT_BACKOFF = 5000; // 5 second base backoff