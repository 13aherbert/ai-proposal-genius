import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Sensitive keys that should never be returned to the client
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action, organizationId, configId, configData } = body as {
      action: 'list' | 'create' | 'update' | 'delete' | 'toggle';
      organizationId: string;
      configId?: string;
      configData?: {
        provider_type: string;
        provider_name: string;
        configuration: Record<string, unknown>;
        is_active: boolean;
      };
    };

    if (!organizationId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is org owner/admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    switch (action) {
      case 'list': {
        const { data, error } = await adminClient
          .from('organization_sso_config')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Mask sensitive fields before returning
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

        // Validate provider_type
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

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'toggle': {
        if (!configId) {
          return new Response(JSON.stringify({ error: 'Config ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify config belongs to org
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

        // Verify config belongs to org
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
