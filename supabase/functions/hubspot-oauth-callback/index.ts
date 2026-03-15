import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const stateParam = url.searchParams.get('state')

    if (!code || !stateParam) {
      return new Response('Missing code or state parameter', { status: 400 })
    }

    // Verify state token HMAC
    const secretKey = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
    const encoder = new TextEncoder()

    let stateData: { payload: string; sig: string }
    try {
      stateData = JSON.parse(atob(decodeURIComponent(stateParam)))
    } catch {
      return new Response('Invalid state parameter', { status: 400 })
    }

    const key = await crypto.subtle.importKey('raw', encoder.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(stateData.payload))
    const expectedHex = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('')

    if (expectedHex !== stateData.sig) {
      return new Response('Invalid state signature - possible CSRF attack', { status: 403 })
    }

    const { organization_id, user_id, ts } = JSON.parse(stateData.payload)

    // Check timestamp (expire after 10 minutes)
    if (Date.now() - ts > 10 * 60 * 1000) {
      return new Response('OAuth state expired. Please try again.', { status: 400 })
    }

    // Exchange code for tokens
    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID')!
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/hubspot-oauth-callback`

    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('HubSpot token exchange failed:', errorText)
      return new Response('Failed to exchange authorization code', { status: 500 })
    }

    const tokens = await tokenResponse.json()

    // Encrypt tokens with AES-256 before storing
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    })

    // Use AES-GCM encryption
    const encKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(clientSecret.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, encoder.encode(tokenData))
    const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')

    // Store integration in database using service role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check for existing HubSpot integration
    const { data: existing } = await serviceClient
      .from('organization_integrations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('integration_name', 'HubSpot')
      .single()

    const integrationData = {
      organization_id,
      integration_type: 'oauth',
      integration_name: 'HubSpot',
      configuration: { scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read', 'crm.objects.deals.write'] },
      credentials: { encrypted: encryptedHex, iv: ivHex },
      is_active: true,
      sync_status: 'idle',
      error_message: null,
    }

    if (existing) {
      await serviceClient
        .from('organization_integrations')
        .update(integrationData)
        .eq('id', existing.id)
    } else {
      const { data: newIntegration } = await serviceClient
        .from('organization_integrations')
        .insert(integrationData)
        .select('id')
        .single()

      // Create default field mappings
      if (newIntegration) {
        await serviceClient.from('integration_field_mappings').insert([
          { integration_id: newIntegration.id, source_field: 'title', target_field: 'dealname', transform_type: 'direct' },
          { integration_id: newIntegration.id, source_field: 'client_name', target_field: 'company', transform_type: 'direct' },
          { integration_id: newIntegration.id, source_field: 'deadline', target_field: 'closedate', transform_type: 'date' },
          { integration_id: newIntegration.id, source_field: 'status', target_field: 'dealstage', transform_type: 'map_status' },
        ])
      }
    }

    // Redirect user back to settings page
    const appUrl = Deno.env.get('APP_URL') || 'https://optirfp.ai'
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/organization/settings?tab=integrations&hubspot=connected` },
    })
  } catch (error) {
    console.error('hubspot-oauth-callback error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
