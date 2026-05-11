// Shared utilities for SSO edge functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export async function checkRateLimit(
  client: SupabaseClient,
  bucketKey: string,
  endpoint: string,
  maxAttempts = 30,
  windowSeconds = 60,
): Promise<boolean> {
  const { data, error } = await client.rpc('sso_check_rate_limit', {
    _bucket_key: bucketKey,
    _endpoint: endpoint,
    _max_attempts: maxAttempts,
    _window_seconds: windowSeconds,
  });
  if (error) {
    console.error('rate limit check failed', error);
    return true; // fail open to avoid lockout from infra issues
  }
  return data === true;
}

// Authenticate caller from Bearer JWT and require org owner/admin.
// Returns { userId, orgId } on success, or a Response on failure.
export async function requireOrgAdmin(
  req: Request,
  client: SupabaseClient,
  orgId: string,
): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing authorization' }, 401);
  }
  const token = authHeader.slice(7);
  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData.user) {
    return jsonResponse({ error: 'Invalid token' }, 401);
  }
  const userId = userData.user.id;
  const { data: isAdmin, error: roleErr } = await client.rpc('user_is_org_owner_or_admin', {
    _user_id: userId,
    _org_id: orgId,
  });
  if (roleErr || !isAdmin) {
    return jsonResponse({ error: 'Forbidden — owner or admin required' }, 403);
  }
  return { userId };
}

// Hash an opaque token for storage (we never store the raw token).
export async function hashToken(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}
