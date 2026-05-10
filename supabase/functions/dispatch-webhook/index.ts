import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function decryptSecret(ciphertextB64: string, ivB64: string): Promise<string> {
  const rawB64 = Deno.env.get('INTEGRATIONS_ENCRYPTION_KEY');
  if (!rawB64) throw new Error('INTEGRATIONS_ENCRYPTION_KEY not configured');
  const raw = base64ToBytes(rawB64);
  if (raw.byteLength !== 32) throw new Error('INTEGRATIONS_ENCRYPTION_KEY must decode to 32 bytes');
  const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivB64) },
    key,
    base64ToBytes(ciphertextB64),
  );
  return new TextDecoder().decode(plaintext);
}

async function resolveSigningSecret(webhook: { secret_key?: string | null; secret_key_ciphertext?: string | null; secret_key_iv?: string | null }): Promise<string | null> {
  if (webhook.secret_key_ciphertext && webhook.secret_key_iv) {
    return await decryptSecret(webhook.secret_key_ciphertext, webhook.secret_key_iv);
  }
  // Legacy plaintext fallback (for any rows that pre-date the encryption migration).
  return webhook.secret_key ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { organization_id, event_type, payload } = await req.json();
    if (!organization_id || !event_type) {
      return new Response(JSON.stringify({ error: 'organization_id and event_type required' }), { status: 400, headers: corsHeaders });
    }

    // Authorization: caller must be an active member of the target organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!member) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Fetch active webhooks subscribed to this event
    const { data: webhooks, error: whError } = await supabase
      .from('organization_webhooks')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .contains('events', [event_type]);

    if (whError) throw whError;

    const results = [];
    const timestamp = new Date().toISOString();
    const eventPayload = JSON.stringify({
      event: event_type,
      timestamp,
      data: payload || {},
      organization_id,
    });

    for (const webhook of (webhooks || [])) {
      let responseStatus = 0;
      let responseBody = '';
      let delivered = false;

      try {
        const signingSecret = await resolveSigningSecret(webhook);
        if (!signingSecret) throw new Error('Webhook signing secret unavailable');
        const signature = await hmacSign(signingSecret, eventPayload);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), (webhook.timeout_seconds || 30) * 1000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event_type,
            'X-Webhook-Timestamp': timestamp,
            ...((webhook.headers as Record<string, string>) || {}),
          },
          body: eventPayload,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseStatus = response.status;
        responseBody = await response.text().catch(() => '');
        delivered = responseStatus >= 200 && responseStatus < 300;
      } catch (fetchError: any) {
        responseBody = fetchError.message || 'Request failed';
      }

      // Log delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        organization_id,
        event_type,
        payload: payload || {},
        response_status: responseStatus,
        response_body: responseBody.substring(0, 5000),
        attempts: 1,
        delivered_at: delivered ? new Date().toISOString() : null,
      });

      // Update webhook stats
      if (delivered) {
        await supabase.from('organization_webhooks')
          .update({ success_count: (webhook.success_count || 0) + 1, last_triggered_at: new Date().toISOString() })
          .eq('id', webhook.id);
      } else {
        await supabase.from('organization_webhooks')
          .update({ failure_count: (webhook.failure_count || 0) + 1, last_triggered_at: new Date().toISOString() })
          .eq('id', webhook.id);
      }

      results.push({ webhook_id: webhook.id, status: responseStatus, delivered });
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
