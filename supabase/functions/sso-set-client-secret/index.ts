// Admin-only endpoint to set or rotate an OIDC client secret.
// Plaintext is encrypted with SSO_SECRET_ENCRYPTION_KEY (AES-GCM) before storage.
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  requireOrgAdmin,
  encryptSecret,
  bytesToHexLiteral,
  checkRateLimit,
  getClientIp,
} from "../_shared/sso.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const ssoConfigId = String(body.sso_config_id || '');
    const clientSecret = String(body.client_secret || '');
    if (!ssoConfigId || !clientSecret) {
      return jsonResponse({ error: 'sso_config_id and client_secret are required' }, 400);
    }
    if (clientSecret.length > 4096) {
      return jsonResponse({ error: 'client_secret too long' }, 400);
    }

    const client = adminClient();

    // Look up the org for this sso config so we can authorize the caller
    const { data: cfg, error: cfgErr } = await client
      .from('organization_sso_config')
      .select('id, organization_id, provider_type')
      .eq('id', ssoConfigId)
      .maybeSingle();
    if (cfgErr || !cfg) return jsonResponse({ error: 'SSO config not found' }, 404);
    if (cfg.provider_type !== 'oidc') {
      return jsonResponse({ error: 'Client secrets only apply to OIDC providers' }, 400);
    }

    const auth = await requireOrgAdmin(req, client, cfg.organization_id);
    if (auth instanceof Response) return auth;

    const ipOk = await checkRateLimit(client, getClientIp(req), 'sso-set-client-secret', 20, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const { ciphertext, iv } = await encryptSecret(clientSecret);

    const { error: upErr } = await client
      .from('sso_client_secrets')
      .upsert({
        sso_config_id: ssoConfigId,
        ciphertext: bytesToHexLiteral(ciphertext),
        iv: bytesToHexLiteral(iv),
        set_by: auth.userId,
        last_set_at: new Date().toISOString(),
      });
    if (upErr) {
      console.error('upsert client secret failed', upErr);
      return jsonResponse({ error: 'Failed to store client secret' }, 500);
    }

    return jsonResponse({ ok: true, last_set_at: new Date().toISOString() });
  } catch (err) {
    console.error('sso-set-client-secret error', err);
    return jsonResponse({ error: 'Internal error', details: String(err) }, 500);
  }
});
