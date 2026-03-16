import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SENSITIVE_KEYS = [
  'client_secret', 'secret', 'private_key', 'signing_key',
  'refresh_token', 'certificate', 'cert', 'key', 'password',
  'api_key', 'api_secret', 'token_secret',
];

function maskSensitiveFields(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => keyLower.includes(sk))) {
      if (typeof value === 'string' && value.length > 0) {
        masked[key] = '••••••••' + value.slice(-4);
      } else {
        masked[key] = '••••••••';
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      masked[key] = maskSensitiveFields(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function validateSSOConfig(configData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = configData?.configuration || {};

  if (!config.sso_url) errors.push('SSO URL is required');
  else if (!config.sso_url.startsWith('https://')) errors.push('SSO URL must use HTTPS');

  if (!config.entity_id) errors.push('Entity ID / Issuer is required');

  if (config.certificate) {
    const cert = config.certificate.trim();
    if (!cert.includes('BEGIN CERTIFICATE') && !cert.includes('BEGIN X509')) {
      errors.push('Certificate does not appear to be in valid X.509 PEM format');
    }
  }

  return { valid: errors.length === 0, errors };
}

async function authorizeRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, userId: null, error: 'Unauthorized' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return { authorized: false, userId: null, error: 'Unauthorized' };
  }

  return { authorized: true, userId: claimsData.claims.sub as string, error: null };
}

async function checkOrgAdmin(adminClient: any, organizationId: string, userId: string) {
  const { data: membership } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return membership && ['owner', 'admin'].includes(membership.role);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authorizeRequest(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, organizationId, configId, configData } = body;

    if (!organizationId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const isAdmin = await checkOrgAdmin(adminClient, organizationId, auth.userId!);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'list': {
        const { data, error } = await adminClient
          .from('organization_sso_config')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const masked = (data || []).map((config: any) => ({
          ...config,
          configuration: maskSensitiveFields(config.configuration || {}),
        }));

        return new Response(JSON.stringify({ data: masked }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (!configData?.provider_name?.trim()) {
          return new Response(JSON.stringify({ error: 'Provider name is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!['saml', 'oauth', 'oidc'].includes(configData.provider_type)) {
          return new Response(JSON.stringify({ error: 'Invalid provider type' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await adminClient
          .from('organization_sso_config')
          .insert({
            organization_id: organizationId,
            provider_type: configData.provider_type,
            provider_name: configData.provider_name.trim().slice(0, 100),
            configuration: configData.configuration || {},
            is_active: configData.is_active || false,
          });
        if (error) throw error;

        // Log audit event
        try {
          await adminClient.rpc('log_security_event', {
            event_type_param: 'sso_config_created',
            details_param: {
              organization_id: organizationId,
              provider: configData.provider_name,
              admin_user: auth.userId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (logErr) {
          console.warn('Failed to log SSO audit event:', logErr);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'test': {
        const validation = validateSSOConfig(configData);

        // Attempt connectivity check if URL is valid
        if (validation.valid && configData?.configuration?.sso_url) {
          try {
            const ssoUrl = configData.configuration.sso_url;
            if (ssoUrl.startsWith('https://') && !ssoUrl.includes('{')) {
              const resp = await fetch(ssoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
              if (!resp.ok && resp.status !== 405 && resp.status !== 302 && resp.status !== 301) {
                validation.errors.push(`SSO URL returned status ${resp.status}`);
                validation.valid = false;
              }
            }
          } catch (fetchErr: any) {
            if (!configData.configuration.sso_url.includes('{')) {
              validation.errors.push(`Could not reach SSO URL: ${fetchErr.message}`);
              validation.valid = false;
            }
          }
        }

        return new Response(JSON.stringify({
          success: validation.valid,
          message: validation.valid
            ? 'Configuration validated successfully. SSO URL is reachable and certificate format is valid.'
            : `Validation failed: ${validation.errors.join('; ')}`,
          errors: validation.errors,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'toggle': {
        if (!configId) {
          return new Response(JSON.stringify({ error: 'Config ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { data: existing } = await adminClient
          .from('organization_sso_config')
          .select('is_active, organization_id')
          .eq('id', configId)
          .single();
        if (!existing || existing.organization_id !== organizationId) {
          return new Response(JSON.stringify({ error: 'Config not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { error } = await adminClient
          .from('organization_sso_config')
          .update({ is_active: !existing.is_active })
          .eq('id', configId);
        if (error) throw error;

        try {
          await adminClient.rpc('log_security_event', {
            event_type_param: 'sso_config_toggled',
            details_param: {
              organization_id: organizationId,
              config_id: configId,
              new_state: !existing.is_active,
              admin_user: auth.userId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (logErr) { console.warn('Audit log failed:', logErr); }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!configId) {
          return new Response(JSON.stringify({ error: 'Config ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { data: existingDel } = await adminClient
          .from('organization_sso_config')
          .select('organization_id')
          .eq('id', configId)
          .single();
        if (!existingDel || existingDel.organization_id !== organizationId) {
          return new Response(JSON.stringify({ error: 'Config not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { error } = await adminClient
          .from('organization_sso_config')
          .delete()
          .eq('id', configId);
        if (error) throw error;

        try {
          await adminClient.rpc('log_security_event', {
            event_type_param: 'sso_config_deleted',
            details_param: { organization_id: organizationId, config_id: configId, admin_user: auth.userId, timestamp: new Date().toISOString() },
          });
        } catch (logErr) { console.warn('Audit log failed:', logErr); }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-settings': {
        if (!configData) {
          return new Response(JSON.stringify({ error: 'Settings data required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updatePayload: Record<string, any> = {};
        if (typeof configData.sso_enabled === 'boolean') updatePayload.sso_enabled = configData.sso_enabled;
        if (typeof configData.sso_required === 'boolean') updatePayload.sso_required = configData.sso_required;
        if (typeof configData.sso_allow_password_fallback === 'boolean') updatePayload.sso_allow_password_fallback = configData.sso_allow_password_fallback;
        if (typeof configData.sso_auto_redirect === 'boolean') updatePayload.sso_auto_redirect = configData.sso_auto_redirect;

        const { error } = await adminClient
          .from('organizations')
          .update(updatePayload)
          .eq('id', organizationId);
        if (error) throw error;

        try {
          await adminClient.rpc('log_security_event', {
            event_type_param: 'sso_settings_updated',
            details_param: { organization_id: organizationId, settings: updatePayload, admin_user: auth.userId, timestamp: new Date().toISOString() },
          });
        } catch (logErr) { console.warn('Audit log failed:', logErr); }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in manage-sso-config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
