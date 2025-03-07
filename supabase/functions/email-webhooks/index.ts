
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Support response webhook payload
interface SupportResponseWebhookPayload {
  ticketId: string;
  responseMessage: string;
  secret: string;
}

serve(async (req) => {
  console.log("Email webhook service received request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    console.error(`Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }

  try {
    // Parse webhook payload
    const payload = await req.json();
    console.log("Received webhook payload:", payload);
    
    // Verify webhook secret
    const webhookSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    if (payload.secret !== webhookSecret) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Handle support response webhook
    if ('ticketId' in payload) {
      return await handleSupportResponseWebhook(payload as SupportResponseWebhookPayload);
    }
    
    // Unknown webhook type
    return new Response(
      JSON.stringify({ error: "Unknown webhook type" }),
      { 
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

/**
 * Handle support response webhook for automated emails
 */
async function handleSupportResponseWebhook(payload: SupportResponseWebhookPayload) {
  const { ticketId, responseMessage } = payload;
  
  try {
    // Fetch ticket details from database
    const { data: ticketData, error: ticketError } = await supabase
      .from("support_tickets")
      .select("user_id, email, name")
      .eq("ticket_id", ticketId)
      .single();
    
    if (ticketError || !ticketData) {
      console.error("Error fetching ticket data:", ticketError);
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Fetch user profile data
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("profile_id", ticketData.user_id)
      .single();
    
    if (userError && !ticketData.email) {
      console.error("Error fetching user data:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Determine user email and name
    const userEmail = ticketData.email || userData?.email;
    const userName = ticketData.name || 
      (userData ? `${userData.first_name} ${userData.last_name}`.trim() : "User");
    
    if (!userEmail) {
      throw new Error("Could not determine user email");
    }
    
    // Prepare support URL
    const supportUrl = `${Deno.env.get("PUBLIC_URL") || ""}/support/tickets/${ticketId}`;
    
    // Call the send-email function to send the response notification
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: [userEmail],
        subject: `New Response to Your Support Request (Ticket #${ticketId}) - OptiRFP`,
        templateType: "support_response",
        templateData: {
          name: userName,
          ticketId,
          responseMessage,
          supportUrl
        }
      }
    });
    
    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }
    
    console.log("Support response email sent successfully:", data);
    
    // Update ticket status in database
    const { error: updateError } = await supabase
      .from("support_tickets")
      .update({ 
        status: "responded", 
        updated_at: new Date().toISOString() 
      })
      .eq("ticket_id", ticketId);
    
    if (updateError) {
      console.error("Error updating ticket status:", updateError);
      // Continue execution, don't fail the webhook just because status update failed
    }
    
    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in handleSupportResponseWebhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
