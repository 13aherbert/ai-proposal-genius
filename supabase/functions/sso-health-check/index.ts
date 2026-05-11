// Admin diagnostics for SSO. Returns the readiness state of the org's SSO config
// plus platform-level signals (env-var presence, recent error counts).
import {
  adminClient,
  corsHeaders,
  jsonResponse,
  requireOrgAdmin,
  checkRateLimit,
  getClientIp,
} from "../_shared/sso.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get('organization_id') || '';
    if (!orgId) return jsonResponse({ error: 'organization_id required' }, 400);

    const client = adminClient();

    const auth = await requireOrgAdmin(req, client, orgId);
    if (auth instanceof Response) return auth;

    const ipOk = await checkRateLimit(client, getClientIp(req), 'sso-health-check', 30, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const [
      { data: domains },
      { data: providers },
      { data: secretRows },
      { data: org },
      { count: recentErrors },
    ] = await Promise.all([
      client.from('organization_domains')
        .select('domain, is_verified, verified_at')
        .eq('organization_id', orgId),
      client.from('organization_sso_config')
        .select('id, provider_type, provider_name, is_active, configuration')
        .eq('organization_id', orgId),
      client.from('sso_client_secrets').select('sso_config_id, last_set_at'),
      client.from('organizations')
        .select('sso_enabled, sso_required, sso_auto_redirect, sso_allow_password_fallback')
        .eq('id', orgId)
        .maybeSingle(),
      client.from('sso_rate_limits')
        .select('*', { count: 'exact', head: true })
        .gt('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const secretMap = new Map<string, string>();
    for (const r of secretRows || []) secretMap.set(r.sso_config_id as string, r.last_set_at as string);

    const providerSummaries = (providers || []).map((p) => ({
      id: p.id,
      type: p.provider_type,
      name: p.provider_name,
      active: p.is_active,
      has_client_secret: p.provider_type === 'oidc' ? secretMap.has(p.id as string) : null,
      client_secret_set_at: secretMap.get(p.id as string) ?? null,
      configuration_complete: isConfigComplete(p.provider_type as string, p.configuration as Record<string, unknown>),
    }));

    const verifiedDomains = (domains || []).filter((d) => d.is_verified).length;
    const oidcProviders = providerSummaries.filter((p) => p.type === 'oidc').length;
    const samlProviders = providerSummaries.filter((p) => p.type === 'supabase_native' || p.type === 'saml').length;

    const platform = {
      sb_mgmt_token_present: !!Deno.env.get('SB_MGMT_API_TOKEN'),
      sso_encryption_key_present: !!Deno.env.get('SSO_SECRET_ENCRYPTION_KEY'),
    };

    const readiness = {
      domains_verified: verifiedDomains > 0,
      provider_configured: providerSummaries.some((p) => p.active && p.configuration_complete),
      oidc_secrets_set: oidcProviders === 0 || providerSummaries.filter((p) => p.type === 'oidc' && p.active).every((p) => p.has_client_secret),
      saml_token_present: samlProviders === 0 || platform.sb_mgmt_token_present,
      encryption_key_present: oidcProviders === 0 || platform.sso_encryption_key_present,
    };
    const ready = Object.values(readiness).every(Boolean);

    return jsonResponse({
      ready,
      readiness,
      domains: domains || [],
      providers: providerSummaries,
      enforcement: {
        sso_enabled: org?.sso_enabled ?? false,
        sso_required: org?.sso_required ?? false,
        sso_auto_redirect: org?.sso_auto_redirect ?? false,
        sso_allow_password_fallback: org?.sso_allow_password_fallback ?? true,
      },
      platform,
      recent_rate_limit_events_24h: recentErrors ?? 0,
    });
  } catch (err) {
    console.error('sso-health-check error', err);
    return jsonResponse({ error: 'Internal error', details: String(err) }, 500);
  }
});

function isConfigComplete(providerType: string, cfg: Record<string, unknown>): boolean {
  if (!cfg) return false;
  if (providerType === 'oidc') {
    return !!(cfg.token_endpoint && cfg.jwks_uri && cfg.issuer && cfg.client_id);
  }
  if (providerType === 'supabase_native' || providerType === 'saml') {
    return !!(cfg.entity_id || cfg.metadata_url || cfg.metadata_xml);
  }
  return false;
}
