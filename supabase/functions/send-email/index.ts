
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// Import our email templates
import WelcomeEmail from "./templates/Welcome.tsx";
import PasswordResetEmail from "./templates/PasswordReset.tsx";
import SupportEmail from "./templates/Support.tsx";
import SupportResponseEmail from "./templates/SupportResponse.tsx";
import BetaInviteEmail from "./templates/BetaInvite.tsx";
import BetaAnnouncementEmail from "./templates/BetaAnnouncement.tsx";

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Email request interface
interface EmailRequest {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateType?: "welcome" | "password_reset" | "support" | "support_response" | "beta_invite" | "beta_announcement";
  templateData?: Record<string, any>;
}

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_EMAILS_PER_MINUTE = 20;
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
  return record.count > MAX_EMAILS_PER_MINUTE;
}

// Validate email data
function validateEmailRequest(request: EmailRequest): { valid: boolean; error?: string } {
  // Check required fields
  if (!request.to || !Array.isArray(request.to) || request.to.length === 0) {
    return { valid: false, error: "Missing or invalid 'to' field" };
  }
  
  if (!request.subject) {
    return { valid: false, error: "Missing 'subject' field" };
  }
  
  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allEmails = [
    ...(request.to || []),
    ...(request.cc || []),
    ...(request.bcc || [])
  ];
  
  for (const email of allEmails) {
    if (!emailRegex.test(email)) {
      return { valid: false, error: `Invalid email address: ${email}` };
    }
  }
  
  // Validate template-specific data
  if (request.templateType && request.templateData) {
    switch(request.templateType) {
      case "welcome": {
        if (!request.templateData.firstName && !request.templateData.appUrl) {
          return { valid: false, error: "Invalid welcome template data" };
        }
        break;
      }
      case "password_reset": {
        if (!request.templateData.resetUrl) {
          return { valid: false, error: "Missing resetUrl in password reset template data" };
        }
        break;
      }
      case "support": {
        if (!request.templateData.name || !request.templateData.message || !request.templateData.ticketId) {
          return { valid: false, error: "Invalid support template data" };
        }
        break;
      }
      case "support_response": {
        if (!request.templateData.name || !request.templateData.ticketId || !request.templateData.responseMessage) {
          return { valid: false, error: "Invalid support response template data" };
        }
        break;
      }
      // Add other template validations as needed
    }
  } else if (!request.templateType && !request.html && !request.text) {
    return { valid: false, error: "Email content is required (html, text, or template)" };
  }
  
  return { valid: true };
}

serve(async (req) => {
  console.log("Email service received request");
  
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return addCorsHeaders(new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }

    // Get request data
    const requestData: EmailRequest = await req.json();
    console.log("Received email request:", {
      to: requestData.to,
      subject: requestData.subject,
      templateType: requestData.templateType
    });

    // Validate email request
    const validationResult = validateEmailRequest(requestData);
    if (!validationResult.valid) {
      console.error("Invalid email request:", validationResult.error);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: validationResult.error }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      ));
    }

    // Configure default sender if not provided
    const from = requestData.from || "OptiRFP <notifications@example.com>";

    // Send email directly with provided HTML
    if (requestData.html) {
      console.log("Sending custom HTML email");
      const { data, error } = await resend.emails.send({
        from,
        to: requestData.to,
        subject: requestData.subject,
        html: requestData.html,
        text: requestData.text,
        cc: requestData.cc,
        bcc: requestData.bcc,
        reply_to: requestData.replyTo
      });

      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }

      console.log("Email sent successfully:", data);
      return addCorsHeaders(new Response(
        JSON.stringify({ id: data?.id }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      ));
    } 
    // Handle template-based emails using React Email
    else if (requestData.templateType && requestData.templateData) {
      console.log(`Sending template email: ${requestData.templateType}`);
      
      // Render appropriate template based on templateType
      let html = "";
      
      switch(requestData.templateType) {
        case "welcome": {
          const { firstName, appUrl } = requestData.templateData;
          html = render(React.createElement(WelcomeEmail, { firstName, appUrl }));
          break;
        }
        case "password_reset": {
          const { resetUrl, expiresIn } = requestData.templateData;
          html = render(React.createElement(PasswordResetEmail, { resetUrl, expiresIn }));
          break;
        }
        case "support": {
          const { name, message, ticketId, supportUrl } = requestData.templateData;
          html = render(React.createElement(SupportEmail, { name, message, ticketId, supportUrl }));
          break;
        }
        case "support_response": {
          const { name, ticketId, responseMessage, supportUrl } = requestData.templateData;
          html = render(React.createElement(SupportResponseEmail, { name, ticketId, responseMessage, supportUrl }));
          break;
        }
        case "beta_invite": {
          const { inviteCode, inviteUrl, expiresAt } = requestData.templateData;
          html = render(React.createElement(BetaInviteEmail, { inviteCode, inviteUrl, expiresAt }));
          break;
        }
        case "beta_announcement": {
          const { featureName, featureDetails, featureUrl } = requestData.templateData;
          html = render(React.createElement(BetaAnnouncementEmail, { 
            featureName, 
            featureDetails, 
            featureUrl 
          }));
          break;
        }
        default:
          throw new Error(`Unknown template type: ${requestData.templateType}`);
      }
      
      const { data, error } = await resend.emails.send({
        from,
        to: requestData.to,
        subject: requestData.subject,
        html,
        cc: requestData.cc,
        bcc: requestData.bcc,
        reply_to: requestData.replyTo
      });
      
      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }
      
      console.log("Template email sent successfully:", data);
      return addCorsHeaders(new Response(
        JSON.stringify({ id: data?.id }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      ));
    }
    else {
      throw new Error("Either HTML content or template information must be provided");
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return addCorsHeaders(new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ));
  }
});
