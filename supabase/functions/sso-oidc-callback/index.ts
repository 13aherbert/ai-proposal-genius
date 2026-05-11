// Path B (OIDC): Receive code+state, exchange for tokens, verify id_token via JWKS,
// issue an sso_handoff_tokens row, and redirect the browser to /sso/finish?token=...
// The frontend then POSTs the token to sso-auth-callback to receive the magic link.
import { adminClient, corsHeaders, jsonResponse, randomToken, hashToken, checkRateLimit, getClientIp, decryptSecret, hexLiteralToBytes } from "../_shared/sso.ts";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    if (error) return jsonResponse({ error: `IdP returned: ${error}` }, 400);
    if (!code || !state) return jsonResponse({ error: 'code and state required' }, 400);

    const client = adminClient();
    const ipOk = await checkRateLimit(client, getClientIp(req), 'sso-oidc-callback', 30, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    // Consume state row
    const stateHash = await hashToken(`oidc-state:${state}`);
    const { data: stateRow, error: stateErr } = await client
      .from('sso_handoff_tokens')
      .delete()
      .eq('token_hash', stateHash)
      .gt('expires_at', new Date().toISOString())
      .select('organization_id, first_name, last_name')
      .single();
    if (stateErr || !stateRow) return jsonResponse({ error: 'Invalid or expired state' }, 400);

    const verifier = stateRow.first_name as string;
    const nonce = stateRow.last_name as string;
    const orgId = stateRow.organization_id;

    const { data: cfg } = await client
      .from('organization_sso_config')
      .select('id, configuration')
      .eq('organization_id', orgId)
      .eq('provider_type', 'oidc')
      .eq('is_active', true)
      .single();
    if (!cfg) return jsonResponse({ error: 'No active OIDC config' }, 400);
    const c = cfg.configuration as Record<string, string>;

    const tokenEndpoint = c.token_endpoint;
    const jwksUri = c.jwks_uri;
    const issuer = c.issuer;
    const clientId = c.client_id;
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sso-oidc-callback`;

    if (!tokenEndpoint || !jwksUri || !issuer || !clientId) {
      return jsonResponse({ error: 'OIDC config incomplete' }, 400);
    }

    // Load and decrypt the client secret from sso_client_secrets (if any)
    let clientSecret: string | undefined;
    const { data: secretRow } = await client
      .from('sso_client_secrets')
      .select('ciphertext, iv')
      .eq('sso_config_id', cfg.id)
      .maybeSingle();
    if (secretRow) {
      try {
        clientSecret = await decryptSecret(
          hexLiteralToBytes(secretRow.ciphertext as unknown as string),
          hexLiteralToBytes(secretRow.iv as unknown as string),
        );
      } catch (e) {
        console.error('client secret decrypt failed', e);
        return jsonResponse({ error: 'Failed to load client secret' }, 500);
      }
    }

    // Exchange code for tokens
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    });
    if (clientSecret) params.set('client_secret', clientSecret);

    const tokRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const tokJson = await tokRes.json().catch(() => ({}));
    if (!tokRes.ok || !tokJson.id_token) {
      console.error('Token exchange failed', tokRes.status, tokJson);
      return jsonResponse({ error: 'Token exchange failed', details: tokJson }, 400);
    }

    // Verify id_token signature and standard claims
    const JWKS = createRemoteJWKSet(new URL(jwksUri));
    const { payload } = await jwtVerify(tokJson.id_token, JWKS, {
      issuer,
      audience: clientId,
    });

    if (payload.nonce && payload.nonce !== nonce) {
      return jsonResponse({ error: 'Nonce mismatch' }, 400);
    }
    const email = (payload.email as string | undefined)?.toLowerCase();
    if (!email) return jsonResponse({ error: 'id_token missing email' }, 400);
    if (payload.email_verified === false) {
      return jsonResponse({ error: 'IdP reports email_verified=false' }, 403);
    }

    // Confirm email domain matches a verified org domain
    const domain = email.split('@')[1];
    const { data: domainOk } = await client
      .from('organization_domains')
      .select('id')
      .eq('organization_id', orgId)
      .eq('domain', domain)
      .eq('is_verified', true)
      .maybeSingle();
    if (!domainOk) return jsonResponse({ error: 'Email domain not authorized for this organization' }, 403);

    // Issue handoff token (5 min, single-use)
    const handoff = randomToken(32);
    await client.from('sso_handoff_tokens').insert({
      token_hash: await hashToken(handoff),
      organization_id: orgId,
      email,
      first_name: (payload.given_name as string) || (payload.name as string)?.split(' ')[0] || '',
      last_name: (payload.family_name as string) || '',
      provider: 'oidc',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    const origin = Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://optirfp.ai';
    const finishUrl = `${origin}/sso/finish?token=${handoff}`;
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: finishUrl } });
  } catch (err) {
    console.error('sso-oidc-callback error', err);
    return jsonResponse({ error: 'Internal error', details: String(err) }, 500);
  }
});
