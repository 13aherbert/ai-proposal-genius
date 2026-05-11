// Path A: Register a SAML provider with Supabase native SSO using the Management API.
// Requires SUPABASE_MGMT_API_TOKEN secret and the project to be on a plan that
// supports native SSO (Pro+). The returned provider_id is stored in
// organization_sso_config.configuration.supabase_provider_id.
import { adminClient, corsHeaders, jsonResponse, requireOrgAdmin } from "../_shared/sso.ts";

const SUPABASE_PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF') || Deno.env.get('PROJECT_REF') || 'bmopbbkfxkgzlbmhhgox';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const { organizationId, metadataUrl, metadataXml, attributeMapping, defaultRole } = body;
    if (!organizationId) return jsonResponse({ error: 'organizationId required' }, 400);
    if (!metadataUrl && !metadataXml) {
      return jsonResponse({ error: 'metadataUrl or metadataXml required' }, 400);
    }

    const mgmtToken = Deno.env.get('SUPABASE_MGMT_API_TOKEN');
    if (!mgmtToken) {
      return jsonResponse({
        error: 'Server not configured: SUPABASE_MGMT_API_TOKEN missing. Add the secret in Lovable Cloud settings.',
      }, 500);
    }

    const client = adminClient();
    const guard = await requireOrgAdmin(req, client, organizationId);
    if (guard instanceof Response) return guard;

    // Collect verified domains for this org
    const { data: domains } = await client
      .from('organization_domains')
      .select('domain')
      .eq('organization_id', organizationId)
      .eq('is_verified', true);
    const domainList = (domains || []).map((d) => d.domain);
    if (domainList.length === 0) {
      return jsonResponse({ error: 'At least one verified domain is required before provisioning SSO.' }, 400);
    }

    // Call Supabase Management API to create the SSO provider
    const mgmtRes = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth/sso/providers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'saml',
          metadata_url: metadataUrl || undefined,
          metadata_xml: metadataXml || undefined,
          domains: domainList,
          attribute_mapping: attributeMapping || {
            keys: {
              email: { name: 'email' },
              first_name: { name: 'first_name' },
              last_name: { name: 'last_name' },
            },
          },
        }),
      },
    );

    const mgmtJson = await mgmtRes.json().catch(() => ({}));
    if (!mgmtRes.ok) {
      console.error('Mgmt API error', mgmtRes.status, mgmtJson);
      return jsonResponse({ error: 'Supabase API error', details: mgmtJson }, mgmtRes.status);
    }

    const providerId = mgmtJson?.id;

    // Persist on organization_sso_config (upsert)
    const { data: existing } = await client
      .from('organization_sso_config')
      .select('id, configuration')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'supabase_native')
      .maybeSingle();

    const newConfig = {
      supabase_provider_id: providerId,
      domains: domainList,
      default_role: defaultRole || 'viewer',
    };

    if (existing) {
      await client.from('organization_sso_config').update({
        configuration: { ...(existing.configuration as Record<string, unknown>), ...newConfig },
        is_active: true,
      }).eq('id', existing.id);
    } else {
      await client.from('organization_sso_config').insert({
        organization_id: organizationId,
        provider_type: 'supabase_native',
        provider_name: 'Supabase SAML',
        configuration: newConfig,
        is_active: true,
      });
    }

    await client.from('organizations').update({ sso_enabled: true }).eq('id', organizationId);

    return jsonResponse({
      success: true,
      providerId,
      acsUrl: `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/sso/saml/acs`,
      entityId: `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/sso/saml/metadata`,
      domains: domainList,
    });
  } catch (err) {
    console.error('provision-sso-provider error', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
