
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

// Import our email templates
import WelcomeEmail from "./templates/Welcome.tsx";
import PasswordResetEmail from "./templates/PasswordReset.tsx";
import SupportEmail from "./templates/Support.tsx";
import BetaInviteEmail from "./templates/BetaInvite.tsx";
import BetaAnnouncementEmail from "./templates/BetaAnnouncement.tsx";

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  templateType?: "welcome" | "password_reset" | "support" | "beta_invite" | "beta_announcement";
  templateData?: Record<string, any>;
}

serve(async (req) => {
  console.log("Email service received request");
  
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Get request data
    const requestData: EmailRequest = await req.json();
    console.log("Received email request:", {
      to: requestData.to,
      subject: requestData.subject,
      templateType: requestData.templateType
    });

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
      return new Response(JSON.stringify({ id: data?.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
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
      return new Response(JSON.stringify({ id: data?.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    else {
      throw new Error("Either HTML content or template information must be provided");
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
