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
    const body = await req.json();
    const { email, firstName, lastName, organizationId, samlSessionId } = body;

    if (!email || !organizationId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify organization exists and has SSO enabled
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, sso_enabled')
      .eq('id', organizationId)
      .eq('sso_enabled', true)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found or SSO not enabled' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Log SSO login
      await adminClient.rpc('log_security_event', {
        event_type_param: 'sso_login_success',
        details_param: {
          email,
          organization_id: organizationId,
          provider: 'saml',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // JIT Provisioning: Create user account
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
          sso_provisioned: true,
          organization_id: organizationId,
        },
      });

      if (createError || !newUser.user) {
        console.error('JIT provisioning failed:', createError);
        return new Response(JSON.stringify({ error: 'Failed to provision user account' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = newUser.user.id;

      // Ensure user is added to organization
      const { data: existingMembership } = await adminClient
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (!existingMembership) {
        await adminClient.from('organization_members').insert({
          organization_id: organizationId,
          user_id: userId,
          role: 'viewer',
          status: 'active',
        });
      }

      // Log provisioning event
      await adminClient.rpc('log_security_event', {
        event_type_param: 'sso_user_provisioned',
        details_param: {
          email,
          organization_id: organizationId,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate a magic link for seamless sign-in
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/dashboard`,
      },
    });

    if (linkError) {
      console.error('Magic link generation failed:', linkError);
      return new Response(JSON.stringify({ error: 'Failed to generate session' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      redirectUrl: linkData?.properties?.action_link || '/dashboard',
      userId,
      isNewUser: !existingUser,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sso-auth-callback:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
