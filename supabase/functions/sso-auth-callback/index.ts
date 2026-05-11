// Hardened SSO sign-in callback.
//
// IMPORTANT: This endpoint no longer trusts an email passed in the request body.
// A trusted server-side validator (Path A post-login hook or Path B OIDC callback)
// must FIRST insert a single-use record into `sso_handoff_tokens` and pass the
// raw token here. We hash the token, look it up, mark it consumed, then JIT-
// provision and issue a magic link for the verified email.
import { adminClient, corsHeaders, jsonResponse, hashToken, checkRateLimit, getClientIp } from "../_shared/sso.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { handoffToken } = await req.json();
    if (!handoffToken || typeof handoffToken !== 'string' || handoffToken.length < 32) {
      return jsonResponse({ error: 'Invalid handoff token' }, 400);
    }

    const client = adminClient();

    const ipOk = await checkRateLimit(client, getClientIp(req), 'sso-auth-callback', 30, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const tokenHash = await hashToken(handoffToken);

    // Atomically consume: only succeeds if not yet consumed and not expired.
    const { data: consumed, error: consumeErr } = await client
      .from('sso_handoff_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('organization_id, email, first_name, last_name, provider')
      .single();

    if (consumeErr || !consumed) {
      return jsonResponse({ error: 'Handoff token invalid or expired' }, 401);
    }

    const email = consumed.email.toLowerCase();
    const organizationId = consumed.organization_id;

    // Verify org still has SSO enabled
    const { data: org } = await client
      .from('organizations')
      .select('id, name, sso_enabled')
      .eq('id', organizationId)
      .eq('sso_enabled', true)
      .single();
    if (!org) return jsonResponse({ error: 'Organization no longer has SSO enabled' }, 403);

    // Look up existing user by email
    const { data: existingList } = await client.auth.admin.listUsers();
    const existingUser = existingList?.users?.find((u) => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Seat-limit check before creating a new member
      const { data: seatOk } = await client.rpc('check_organization_seat_limit', {
        org_id: organizationId,
      });
      if (seatOk === false) {
        return jsonResponse({ error: 'Organization seat limit reached. Contact your administrator.' }, 403);
      }

      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data: created, error: createErr } = await client.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: consumed.first_name || '',
          last_name: consumed.last_name || '',
          sso_provisioned: true,
          organization_id: organizationId,
          provider: consumed.provider,
        },
      });
      if (createErr || !created.user) {
        console.error('JIT create failed', createErr);
        return jsonResponse({ error: 'Failed to provision user' }, 500);
      }
      userId = created.user.id;
      isNewUser = true;

      await client.rpc('log_security_event', {
        event_type_param: 'sso_user_provisioned',
        details_param: { email, organization_id: organizationId, user_id: userId, provider: consumed.provider },
      });
    }

    // Ensure org membership
    const { data: membership } = await client
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      // Read default_role from active SSO config if present
      const { data: ssoCfg } = await client
        .from('organization_sso_config')
        .select('configuration')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      const defaultRole = (ssoCfg?.configuration as { default_role?: string } | null)?.default_role || 'viewer';
      await client.from('organization_members').insert({
        organization_id: organizationId,
        user_id: userId,
        role: defaultRole,
        status: 'active',
      });
    }

    // Set current org on profile if unset
    await client.from('profiles')
      .update({ current_organization_id: organizationId })
      .eq('profile_id', userId)
      .is('current_organization_id', null);

    await client.rpc('log_security_event', {
      event_type_param: 'sso_login_success',
      details_param: { email, organization_id: organizationId, provider: consumed.provider, isNewUser },
    });

    const origin = req.headers.get('origin') || Deno.env.get('SUPABASE_URL');
    const { data: link, error: linkErr } = await client.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (linkErr || !link?.properties?.action_link) {
      console.error('magic link error', linkErr);
      return jsonResponse({ error: 'Failed to generate session' }, 500);
    }

    return jsonResponse({
      success: true,
      redirectUrl: link.properties.action_link,
      userId,
      isNewUser,
    });
  } catch (err) {
    console.error('sso-auth-callback error', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
