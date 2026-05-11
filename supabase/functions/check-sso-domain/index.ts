// Look up SSO configuration for an email domain. Public endpoint used during sign-in.
// Rate-limited per IP. Returns minimal info — never echo internal IDs.
import { adminClient, corsHeaders, jsonResponse, checkRateLimit, getClientIp } from "../_shared/sso.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return jsonResponse({ error: 'Valid email required' }, 400);
    }

    const client = adminClient();
    const ipOk = await checkRateLimit(client, getClientIp(req), 'check-sso-domain', 60, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const domain = email.split('@')[1].toLowerCase();

    const { data: domainData } = await client
      .from('organization_domains')
      .select('organization_id')
      .eq('domain', domain)
      .eq('is_verified', true)
      .maybeSingle();
    if (!domainData) return jsonResponse({ ssoEnabled: false });

    const { data: org } = await client
      .from('organizations')
      .select('id, name, sso_enabled, sso_required, sso_auto_redirect, sso_allow_password_fallback')
      .eq('id', domainData.organization_id)
      .single();
    if (!org?.sso_enabled) return jsonResponse({ ssoEnabled: false });

    const { data: cfg } = await client
      .from('organization_sso_config')
      .select('provider_type, provider_name, configuration')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (!cfg) return jsonResponse({ ssoEnabled: false });

    // Build the IdP initiation URL based on provider type.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const cfgObj = (cfg.configuration || {}) as Record<string, unknown>;
    let initiateUrl: string | null = null;

    if (cfg.provider_type === 'supabase_native') {
      // Caller will use supabase.auth.signInWithSSO({ domain }) directly.
      initiateUrl = null;
    } else if (cfg.provider_type === 'oidc') {
      initiateUrl = `${supabaseUrl}/functions/v1/sso-oidc-init?org=${org.id}&email=${encodeURIComponent(email)}`;
    } else {
      // Legacy SAML config — fall back to the IdP SSO URL string if present.
      initiateUrl = (cfgObj.sso_url as string) || null;
    }

    return jsonResponse({
      ssoEnabled: true,
      providerType: cfg.provider_type,
      providerName: cfg.provider_name,
      organizationName: org.name,
      organizationId: org.id,
      ssoRequired: !!org.sso_required,
      ssoAutoRedirect: !!org.sso_auto_redirect,
      passwordFallbackAllowed: org.sso_allow_password_fallback !== false,
      domain,
      initiateUrl,
    });
  } catch (err) {
    console.error('check-sso-domain error', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
