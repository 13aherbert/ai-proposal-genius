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
  // Allow system admins to bypass org membership checks (platform-level diagnostics).
  const { data: sysRole } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'system_admin')
    .maybeSingle();
  if (sysRole) return { userId };

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

// ---------- AES-GCM encryption for OIDC client secrets ----------
// Key is provided via SSO_SECRET_ENCRYPTION_KEY env var. Accepts either a
// 64-char hex string (32 bytes) or a base64-encoded 32-byte value.

function decodeKeyBytes(raw: string): Uint8Array {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) out[i] = parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  // base64 / base64url
  const b64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  if (out.length !== 32) {
    throw new Error(`SSO_SECRET_ENCRYPTION_KEY must decode to 32 bytes (got ${out.length})`);
  }
  return out;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('SSO_SECRET_ENCRYPTION_KEY');
  if (!raw) throw new Error('SSO_SECRET_ENCRYPTION_KEY not configured');
  const bytes = decodeKeyBytes(raw);
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: new Uint8Array(ct), iv };
}

export async function decryptSecret(ciphertext: Uint8Array, iv: Uint8Array): Promise<string> {
  const key = await getEncryptionKey();
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(pt);
}

// Postgres returns bytea over PostgREST as a hex-encoded string like "\x48656c6c6f".
export function bytesToHexLiteral(bytes: Uint8Array): string {
  let s = '\\x';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

export function hexLiteralToBytes(hex: string): Uint8Array {
  const stripped = hex.startsWith('\\x') ? hex.slice(2) : hex;
  const out = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  return out;
}
