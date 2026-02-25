
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SetAdminRequest {
  adminEmail: string;
  secretKey: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminSecretKey = Deno.env.get("ADMIN_SECRET_KEY");
  if (!adminSecretKey) {
    console.error("ADMIN_SECRET_KEY environment variable is not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Create authenticated Supabase client with service role key
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  try {
    // Parse request
    const { adminEmail, secretKey }: SetAdminRequest = await req.json();

    // Validate the secret key
    if (secretKey !== adminSecretKey) {
      console.log("Invalid secret key provided");
      return new Response(
        JSON.stringify({ 
          error: "Invalid secret key" 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the user by email
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error(`Error fetching users: ${fetchError.message}`);
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    const user = users.users.find(u => u.email === adminEmail);
    
    if (!user) {
      console.log(`User not found with email: ${adminEmail}`);
      return new Response(
        JSON.stringify({ 
          error: "User not found" 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found user with ID: ${user.id}`);

    // Check if user already has admin role
    const { data: existingRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (roleError) {
      console.error(`Error checking existing roles: ${roleError.message}`);
      throw new Error(`Error checking existing roles: ${roleError.message}`);
    }

    if (existingRoles && existingRoles.length > 0) {
      console.log(`User ${user.id} is already an admin`);
      return new Response(
        JSON.stringify({ 
          message: "User is already an admin",
          userId: user.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Assign admin role
    const { data: role, error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "admin",
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error assigning admin role: ${insertError.message}`);
      throw new Error(`Error assigning admin role: ${insertError.message}`);
    }

    console.log(`Successfully assigned admin role to user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        message: "User has been assigned admin role successfully",
        userId: user.id,
        role: role
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in set-initial-admin function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "An internal error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
