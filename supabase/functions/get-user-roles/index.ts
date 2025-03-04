
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Import the CORS headers from the shared utility
import { corsHeaders } from "../_shared/cors.ts";

type UserRole = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by: string | null;
};

type UserEmailInfo = {
  id: string;
  email: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Check if the user is an admin using the is_admin RPC
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin');
    
    if (adminCheckError) {
      console.error("Admin check error:", adminCheckError);
      return new Response(
        JSON.stringify({ error: "Error checking admin status", details: adminCheckError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all user roles
    const { data: roleRecords, error: getRolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (getRolesError) {
      console.error("Error fetching user roles:", getRolesError);
      return new Response(
        JSON.stringify({ error: "Error fetching user roles", details: getRolesError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email information for all users from auth.users table using service role
    const { data: userEmails, error: emailError } = await supabase.auth.admin.listUsers();
    
    if (emailError) {
      console.error("Error fetching user emails:", emailError);
      return new Response(
        JSON.stringify({ error: "Error fetching user emails", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combine roles with email information
    const enhancedRoleRecords = roleRecords.map((role) => {
      const user = userEmails.users.find((u) => u.id === role.user_id);
      return {
        ...role,
        email: user?.email || null
      };
    });

    return new Response(
      JSON.stringify(enhancedRoleRecords),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
