import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: hash-api-key
 * 
 * Securely hashes API keys using bcrypt with a work factor of 12.
 * This provides protection against offline brute-force attacks
 * if the database is compromised.
 * 
 * bcrypt is designed to be slow and resistant to GPU attacks,
 * unlike SHA-256 which is optimized for speed.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { apiKey, action } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key format (should start with 'oak_' and be 68 chars)
    if (!apiKey.startsWith('oak_') || apiKey.length !== 68) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'hash') {
      // Hash the API key using bcrypt with 12 rounds
      // 12 rounds provides ~300ms hashing time, balancing security and usability
      const hash = await bcrypt.hash(apiKey, 12);
      
      return new Response(
        JSON.stringify({ hash }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (action === 'verify') {
      const { hash } = await req.json();
      
      if (!hash || typeof hash !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Missing hash for verification' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const isValid = await bcrypt.compare(apiKey, hash);
      
      return new Response(
        JSON.stringify({ isValid }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Default to hash action
      const hash = await bcrypt.hash(apiKey, 12);
      
      return new Response(
        JSON.stringify({ hash }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in hash-api-key function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
