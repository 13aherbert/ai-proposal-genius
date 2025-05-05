
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "npm:resend";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Support response webhook payload
interface SupportResponseWebhookPayload {
  ticketId: string;
  responseMessage: string;
  secret: string;
}

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Check if a request exceeds rate limits
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record) {
    // First request from this IP
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (now > record.resetTime) {
    // Reset counter if the window has passed
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  // Increment counter
  record.count += 1;
  requestCounts.set(ip, record);
  
  // Check if limit exceeded
  return record.count > MAX_REQUESTS_PER_MINUTE;
}

// Validate email template data
function validateTemplateData(templateType: string, data: any): boolean {
  // Basic validation for support response template
  if (templateType === "support_response") {
    return Boolean(
      data.name && 
      data.ticketId && 
      data.responseMessage &&
      typeof data.name === "string" &&
      typeof data.ticketId === "string" &&
      typeof data.responseMessage === "string"
    );
  }
  
  // For other template types, add validation here
  return true;
}

serve(async (req) => {
  console.log("Email webhook service received request");
  
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Get client IP for rate limiting
  const clientIp = req.headers.get("x-forwarded-for") || 
                  req.headers.get("x-real-ip") || 
                  "unknown";
  
  // Check rate limit
  if (checkRateLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { 
        status: 429, 
        headers: { "Content-Type": "application/json" } 
      }
    ));
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    console.error(`Invalid method: ${req.method}`);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json" } 
      }
    ));
  }

  try {
    // Parse webhook payload
    const payload = await req.json();
    console.log("Received webhook payload:", payload);
    
    // Verify webhook secret
    const webhookSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("EMAIL_WEBHOOK_SECRET environment variable is not set");
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }
    
    if (payload.secret !== webhookSecret) {
      console.error("Invalid webhook secret");
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }

    // Handle support response webhook
    if ('ticketId' in payload) {
      return await handleSupportResponseWebhook(payload as SupportResponseWebhookPayload);
    }
    
    // Unknown webhook type
    return addCorsHeaders(new Response(
      JSON.stringify({ error: "Unknown webhook type" }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    ));
  } catch (error) {
    console.error("Error processing webhook:", error);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ));
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
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }
    
    // Fetch user profile data
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("profile_id", ticketData.user_id)
      .single();
    
    if (userError && !ticketData.email) {
      console.error("Error fetching user data:", userError);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "User not found" }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
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
    
    // Validate template data
    const templateData = {
      name: userName,
      ticketId,
      responseMessage,
      supportUrl
    };
    
    if (!validateTemplateData("support_response", templateData)) {
      throw new Error("Invalid template data");
    }
    
    // Call the send-email function to send the response notification
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: [userEmail],
        subject: `New Response to Your Support Request (Ticket #${ticketId}) - OptiRFP`,
        templateType: "support_response",
        templateData
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
    
    return addCorsHeaders(new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    ));
  } catch (error) {
    console.error("Error in handleSupportResponseWebhook:", error);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ));
  }
}
