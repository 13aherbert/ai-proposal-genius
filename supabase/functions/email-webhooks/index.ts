
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// Initialize Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Support response webhook payload (no longer requires client-side secret)
interface SupportResponseWebhookPayload {
  ticketId: string;
  responseMessage: string;
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
    // SECURITY: Authenticate user via JWT instead of client-side secret
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Unauthorized - Authentication required" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }

    // Create authenticated Supabase client
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT token and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid or expired JWT token:", claimsError);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or expired token" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload = await req.json();
    console.log("Received webhook payload:", { ticketId: payload.ticketId });

    // Handle support response webhook
    if ('ticketId' in payload) {
      return await handleSupportResponseWebhook(
        supabase, 
        payload as SupportResponseWebhookPayload,
        userId
      );
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
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ));
  }
});

/**
 * Handle support response webhook for automated emails
 * SECURITY: Now requires authenticated user and verifies permissions
 */
async function handleSupportResponseWebhook(
  supabase: any,
  payload: SupportResponseWebhookPayload,
  authenticatedUserId: string
) {
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

    // SECURITY: Verify the authenticated user has permission to respond to this ticket
    // Check if user is an admin or the ticket owner
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authenticatedUserId);

    const isAdmin = userRoles?.some((r: any) => r.role === "admin" || r.role === "system_admin");
    const isTicketOwner = ticketData.user_id === authenticatedUserId;

    if (!isAdmin && !isTicketOwner) {
      console.error("User not authorized to respond to this ticket");
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Forbidden - You don't have permission to respond to this ticket" }),
        { 
          status: 403, 
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
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ));
  }
}
