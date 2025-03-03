
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'
import { corsHeaders, handleCors, addCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Check if this is a preflight CORS request
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Only accept POST requests
  if (req.method !== 'POST') {
    return addCorsHeaders(new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    ))
  }

  // Create Supabase client with admin privileges
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get authorization header from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Verify the user with the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Unauthorized user', details: userError }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
    
    if (adminError || !isAdmin) {
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Unauthorized - admin role required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Parse request body to get email
    const requestBody = await req.json()
    const email = requestBody.email

    if (!email) {
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Query for pending invitations for the specified email
    const { data, error } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending invitation:', error)
      return addCorsHeaders(new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ))
    }

    // Return the pending invitations
    return addCorsHeaders(new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ))
    
  } catch (error) {
    console.error('Unexpected error in get-pending-invitation:', error)
    return addCorsHeaders(new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    ))
  }
})
