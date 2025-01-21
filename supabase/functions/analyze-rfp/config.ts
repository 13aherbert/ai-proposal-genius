export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const CHUNK_SIZE = 8000;
export const MAX_RETRIES = 3;
export const MAX_TOKENS = 2000;
export const RATE_LIMIT_BACKOFF = 5000;
export const GPT_MODEL = "gpt-4o";