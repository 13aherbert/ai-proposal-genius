import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function decryptCredentials(credentials: { encrypted: string; iv: string }, secret: string): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  const encKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const encrypted = new Uint8Array(credentials.encrypted.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const iv = new Uint8Array(credentials.iv.match(/.{2}/g)!.map(b => parseInt(b, 16)))

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encKey, encrypted)
  return JSON.parse(decoder.decode(decrypted))
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: Deno.env.get('HUBSPOT_CLIENT_ID')!,
      client_secret: Deno.env.get('HUBSPOT_CLIENT_SECRET')!,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`)
  }

  return response.json()
}

async function encryptAndStoreTokens(serviceClient: any, integrationId: string, tokens: { access_token: string; refresh_token: string; expires_in: number }) {
  const encoder = new TextEncoder()
  const secret = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
  
  const tokenData = JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000),
  })

  const encKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, encoder.encode(tokenData))
  const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')

  await serviceClient
    .from('organization_integrations')
    .update({ credentials: { encrypted: encryptedHex, iv: ivHex } })
    .eq('id', integrationId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userId = claimsData.claims.sub as string
    const { integration_id, sync_type = 'full' } = await req.json()

    if (!integration_id) {
      return new Response(JSON.stringify({ error: 'integration_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get integration
    const { data: integration, error: intError } = await serviceClient
      .from('organization_integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: 'Integration not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify user is org member
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', integration.organization_id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update sync status
    await serviceClient
      .from('organization_integrations')
      .update({ sync_status: 'syncing', error_message: null })
      .eq('id', integration_id)

    // Create sync log
    const { data: syncLog } = await serviceClient
      .from('integration_sync_logs')
      .insert({ integration_id, sync_type, direction: 'push' })
      .select('id')
      .single()

    try {
      // Decrypt credentials
      const secret = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
      let tokenInfo = await decryptCredentials(integration.credentials, secret)

      // Refresh token if expired
      if (Date.now() >= tokenInfo.expires_at - 60000) {
        const newTokens = await refreshAccessToken(tokenInfo.refresh_token)
        await encryptAndStoreTokens(serviceClient, integration_id, newTokens)
        tokenInfo = {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: Date.now() + (newTokens.expires_in * 1000),
        }
      }

      // Get field mappings
      const { data: mappings } = await serviceClient
        .from('integration_field_mappings')
        .select('*')
        .eq('integration_id', integration_id)
        .eq('is_active', true)

      // Get proposals to sync (won/completed status)
      const { data: proposals } = await serviceClient
        .from('projects')
        .select('*')
        .eq('organization_id', integration.organization_id)
        .in('status', ['won', 'completed', 'submitted'])

      let processed = 0
      let failed = 0
      const errors: any[] = []

      // Push proposals as HubSpot deals
      for (const proposal of (proposals || [])) {
        try {
          const dealProperties: Record<string, string> = {}
          
          for (const mapping of (mappings || [])) {
            const sourceValue = (proposal as any)[mapping.source_field]
            if (sourceValue === null || sourceValue === undefined) continue

            switch (mapping.transform_type) {
              case 'date':
                dealProperties[mapping.target_field] = new Date(sourceValue).toISOString().split('T')[0]
                break
              case 'map_status':
                const statusMap: Record<string, string> = {
                  'won': 'closedwon',
                  'completed': 'closedwon',
                  'submitted': 'presentationscheduled',
                  'in_progress': 'qualifiedtobuy',
                  'draft': 'appointmentscheduled',
                }
                dealProperties[mapping.target_field] = statusMap[sourceValue] || 'appointmentscheduled'
                break
              default:
                dealProperties[mapping.target_field] = String(sourceValue)
            }
          }

          if (Object.keys(dealProperties).length === 0) continue

          // Create deal in HubSpot
          const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenInfo.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties: dealProperties }),
          })

          if (hubspotResponse.ok) {
            processed++
          } else {
            const errorBody = await hubspotResponse.text()
            console.error(`Failed to create deal for proposal ${proposal.project_id}:`, errorBody)
            failed++
            errors.push({ proposal_id: proposal.project_id, error: errorBody })
          }

          // Rate limiting: HubSpot allows 100 requests/10 seconds
          if ((processed + failed) % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        } catch (e) {
          failed++
          errors.push({ proposal_id: proposal.project_id, error: String(e) })
        }
      }

      // Update sync log
      await serviceClient
        .from('integration_sync_logs')
        .update({
          records_processed: processed,
          records_failed: failed,
          error_details: errors.length > 0 ? errors : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog!.id)

      // Update integration status
      await serviceClient
        .from('organization_integrations')
        .update({
          sync_status: failed > 0 ? 'error' : 'success',
          last_sync_at: new Date().toISOString(),
          error_message: failed > 0 ? `${failed} records failed to sync` : null,
        })
        .eq('id', integration_id)

      return new Response(JSON.stringify({
        success: true,
        records_processed: processed,
        records_failed: failed,
        errors: errors.length > 0 ? errors : undefined,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (syncError) {
      console.error('Sync error:', syncError)

      await serviceClient
        .from('organization_integrations')
        .update({ sync_status: 'error', error_message: String(syncError) })
        .eq('id', integration_id)

      if (syncLog) {
        await serviceClient
          .from('integration_sync_logs')
          .update({
            records_failed: 1,
            error_details: [{ error: String(syncError) }],
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id)
      }

      return new Response(JSON.stringify({ error: 'Sync failed', details: String(syncError) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (error) {
    console.error('hubspot-sync error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
