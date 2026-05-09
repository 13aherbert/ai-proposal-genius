// Edge function: create-webhook
// -----------------------------------------------------------------------------
// Creates an organization_webhooks row server-side.
// - Generates a fresh whsec_* secret
// - Encrypts it at rest with AES-GCM using INTEGRATIONS_ENCRYPTION_KEY
// - Stores ciphertext + iv + last4 (never returns the plaintext after this call)
// - Requires the caller to be an owner/admin of the target organization
// -----------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function importKey(rawB64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(rawB64);
  if (raw.byteLength !== 32) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY must be 32 bytes (base64 of 32 bytes)');
  }
  return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function encryptString(plaintext: string, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  return { ciphertext: bytesToBase64(ct), iv: bytesToBase64(iv) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const ENC_KEY_B64 = Deno.env.get('INTEGRATIONS_ENCRYPTION_KEY');

    if (!ENC_KEY_B64) return json(500, { error: 'Encryption key not configured' });

    // Identify caller
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) return json(401, { error: 'Missing Authorization header' });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json(401, { error: 'Unauthorized' });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json(400, { error: 'Invalid body' });

    const {
      organization_id,
      name,
      url,
      events,
      is_active = true,
      retry_count = 3,
      timeout_seconds = 30,
      headers = {},
    } = body as Record<string, unknown>;

    if (
      typeof organization_id !== 'string' ||
      typeof name !== 'string' || !name.trim() ||
      typeof url !== 'string' || !url.trim() ||
      !Array.isArray(events)
    ) {
      return json(400, { error: 'Missing or invalid fields' });
    }

    try {
      // Validate URL
      new URL(url);
    } catch {
      return json(400, { error: 'Invalid endpoint URL' });
    }

    // Authorization: caller must be owner/admin of the org
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: isAdmin, error: roleErr } = await admin.rpc(
      'user_is_org_owner_or_admin',
      { user_id_param: user.id, org_id_param: organization_id },
    );
    if (roleErr) {
      console.error('Role check failed:', roleErr);
      return json(500, { error: 'Authorization check failed' });
    }
    if (!isAdmin) return json(403, { error: 'Forbidden — owner or admin required' });

    // Generate the webhook signing secret
    const secretBytes = crypto.getRandomValues(new Uint8Array(24));
    const secretHex = Array.from(secretBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const secretKey = `whsec_${secretHex}`;

    // Encrypt at rest
    const key = await importKey(ENC_KEY_B64);
    const { ciphertext, iv } = await encryptString(secretKey, key);
    const last4 = secretHex.slice(-4);

    const { data: inserted, error: insertErr } = await admin
      .from('organization_webhooks')
      .insert({
        organization_id,
        name,
        url,
        events,
        is_active,
        retry_count,
        timeout_seconds,
        headers,
        secret_key_ciphertext: ciphertext,
        secret_key_iv: iv,
        secret_key_last4: last4,
        secret_key_updated_at: new Date().toISOString(),
        has_secret: true,
      })
      .select(
        'id, organization_id, name, url, events, is_active, retry_count, timeout_seconds, headers, created_at, secret_key_last4',
      )
      .single();

    if (insertErr) {
      console.error('Insert failed:', insertErr);
      return json(500, { error: insertErr.message });
    }

    // Return the plaintext secret ONCE; client must persist/copy now.
    return json(200, {
      webhook: inserted,
      secret_key: secretKey,
      message: 'Save this secret now — it will not be shown again.',
    });
  } catch (err) {
    console.error('create-webhook error:', err);
    return json(500, { error: (err as Error).message ?? 'Unknown error' });
  }
});
