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
        const signature = await hmacSign(webhook.secret_key, eventPayload);
        
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
