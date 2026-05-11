// Path B (OIDC): Build the authorize URL with PKCE and signed state, then redirect.
// State is stored in sso_handoff_tokens-style table (we reuse a short-lived row).
import { adminClient, corsHeaders, jsonResponse, randomToken, hashToken, checkRateLimit, getClientIp } from "../_shared/sso.ts";

async function pkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get('org');
    const email = url.searchParams.get('email') || '';
    if (!orgId) return jsonResponse({ error: 'org required' }, 400);

    const client = adminClient();
    const ipOk = await checkRateLimit(client, getClientIp(req), 'sso-oidc-init', 30, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const { data: cfg } = await client
      .from('organization_sso_config')
      .select('configuration')
      .eq('organization_id', orgId)
      .eq('provider_type', 'oidc')
      .eq('is_active', true)
      .maybeSingle();
    if (!cfg) return jsonResponse({ error: 'No active OIDC configuration' }, 404);

    const c = cfg.configuration as Record<string, string>;
    const authorize = c.authorize_endpoint;
    const clientId = c.client_id;
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sso-oidc-callback`;
    const scopes = c.scopes || 'openid email profile';
    if (!authorize || !clientId) {
      return jsonResponse({ error: 'OIDC config incomplete (authorize_endpoint, client_id required)' }, 400);
    }

    const state = randomToken(24);
    const verifier = randomToken(32);
    const challenge = await pkceChallenge(verifier);
    const nonce = randomToken(16);

    // Store state -> { orgId, verifier, nonce, email } using sso_handoff_tokens
    // (re-purposed as short-lived state store). Token hash is hash(state).
    await client.from('sso_handoff_tokens').insert({
      token_hash: await hashToken(`oidc-state:${state}`),
      organization_id: orgId,
      email: email || 'pending@oidc.local',
      provider: 'oidc',
      first_name: verifier,        // store verifier here (single-use, deleted on consume)
      last_name: nonce,             // store nonce here
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const authUrl = new URL(authorize);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    if (email) authUrl.searchParams.set('login_hint', email);

    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: authUrl.toString() } });
  } catch (err) {
    console.error('sso-oidc-init error', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
