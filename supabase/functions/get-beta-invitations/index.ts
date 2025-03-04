
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with admin privileges
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log("Received request to get-beta-invitations")
    
    // Get JWT token from authorization header
    const authHeader = req.headers.get('Authorization')
    console.log("Auth header present:", !!authHeader)
    
    if (!authHeader) {
      console.log("Missing Authorization header")
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user with the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log("Unauthorized user:", userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized user', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Authenticated user ID:", user.id)

    // Check if user is admin via direct query to user_roles table
    console.log("Checking if user is admin")
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
    
    if (adminError) {
      console.error("Error checking admin status:", adminError)
      return new Response(
        JSON.stringify({ error: 'Error checking admin status', details: adminError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const isAdmin = adminRoles && adminRoles.length > 0
    console.log("Is admin check result:", isAdmin)
    
    if (!isAdmin) {
      console.log("User is not an admin")
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch beta invitations directly using the service role
    console.log("Fetching beta invitations")
    const { data, error } = await supabase
      .from('beta_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching beta invitations:", error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully fetched ${data?.length || 0} beta invitations`)
    
    // Return the beta invitations
    return new Response(
      JSON.stringify(data || []),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Unexpected error in get-beta-invitations:", error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
