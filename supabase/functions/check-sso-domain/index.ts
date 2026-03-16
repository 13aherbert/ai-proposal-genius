import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const domain = email.split('@')[1].toLowerCase();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if domain is verified for any organization
    const { data: domainData } = await adminClient
      .from('organization_domains')
      .select('organization_id')
      .eq('domain', domain)
      .eq('is_verified', true)
      .single();

    if (!domainData) {
      return new Response(JSON.stringify({ ssoEnabled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if org has SSO enabled and an active config
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, sso_enabled')
      .eq('id', domainData.organization_id)
      .single();

    if (!org?.sso_enabled) {
      return new Response(JSON.stringify({ ssoEnabled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: ssoConfig } = await adminClient
      .from('organization_sso_config')
      .select('provider_name, configuration')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!ssoConfig) {
      return new Response(JSON.stringify({ ssoEnabled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ssoEnabled: true,
      ssoUrl: (ssoConfig.configuration as any)?.sso_url || null,
      providerName: ssoConfig.provider_name,
      organizationName: org.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-sso-domain:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
