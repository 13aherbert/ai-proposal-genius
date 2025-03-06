
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
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
    // Handle template-based emails
    else if (requestData.templateType && requestData.templateData) {
      console.log(`Sending template email: ${requestData.templateType}`);
      
      // Render appropriate template based on templateType
      let html = "";
      
      switch(requestData.templateType) {
        case "welcome":
          html = renderWelcomeEmail(requestData.templateData);
          break;
        case "password_reset":
          html = renderPasswordResetEmail(requestData.templateData);
          break;
        case "support":
          html = renderSupportEmail(requestData.templateData);
          break;
        case "beta_invite":
          html = renderBetaInviteEmail(requestData.templateData);
          break;
        case "beta_announcement":
          html = renderBetaAnnouncementEmail(requestData.templateData);
          break;
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

// Email template renderers
function renderWelcomeEmail(data: Record<string, any>): string {
  const { firstName, appUrl } = data;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to OptiRFP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; margin-top: 0;">Welcome to OptiRFP!</h1>
          <p>Hello ${firstName || 'there'},</p>
          <p>Thank you for signing up for OptiRFP. We're excited to help you create better RFP responses and win more business.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${appUrl || 'https://app.optirfp.com'}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get Started Now</a>
          </div>
          <p>If you have any questions, just reply to this email - we're always happy to help.</p>
          <p>Cheers,<br>The OptiRFP Team</p>
        </div>
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} OptiRFP. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

function renderPasswordResetEmail(data: Record<string, any>): string {
  const { resetUrl, expiresIn } = data;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; margin-top: 0;">Password Reset Request</h1>
          <p>We received a request to reset your OptiRFP password.</p>
          <p>Click the button below to set a new password. This link is valid for ${expiresIn || '24 hours'}.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Regards,<br>The OptiRFP Team</p>
        </div>
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} OptiRFP. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

function renderSupportEmail(data: Record<string, any>): string {
  const { ticketId, name, message, supportUrl } = data;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Support Request Received</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; margin-top: 0;">We've Received Your Support Request</h1>
          <p>Hello ${name || 'there'},</p>
          <p>Thank you for contacting OptiRFP support. We've received your request and will get back to you as soon as possible.</p>
          <div style="background-color: #e8e8e8; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Ticket ID:</strong> ${ticketId || 'TKT-' + Date.now()}</p>
            <p style="margin: 10px 0 0;"><strong>Your message:</strong></p>
            <p style="margin: 5px 0 0;">${message || '[No message content]'}</p>
          </div>
          ${supportUrl ? `
          <div style="margin: 30px 0; text-align: center;">
            <a href="${supportUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Support Ticket</a>
          </div>
          ` : ''}
          <p>If you have any additional information to share, please reply to this email.</p>
          <p>Best regards,<br>OptiRFP Support Team</p>
        </div>
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} OptiRFP. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

function renderBetaInviteEmail(data: Record<string, any>): string {
  const { inviteCode, inviteUrl, expiresAt } = data;
  const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'in 30 days';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited to OptiRFP Beta!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #7e22ce; margin-top: 0;">You're Invited to the OptiRFP Beta Program!</h1>
          <p>We're excited to invite you to participate in the beta testing program for OptiRFP.</p>
          <p>As a beta tester, you'll get:</p>
          <ul>
            <li>Early access to new features</li>
            <li>Direct line to our development team</li>
            <li>Opportunity to shape the future of the product</li>
            <li>Extended premium benefits during the beta period</li>
          </ul>
          <div style="background-color: #e8e8e8; border-left: 4px solid #7e22ce; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Invite Code:</strong> ${inviteCode || 'BETAUSER2023'}</p>
            <p style="margin: 10px 0 0;"><strong>Expires:</strong> ${expirationDate}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${inviteUrl || 'https://app.optirfp.com/beta?invite=' + (inviteCode || 'BETAUSER2023')}" style="background-color: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Beta Program</a>
          </div>
          <p>Thank you for your interest in OptiRFP. We look forward to your valuable feedback!</p>
          <p>Best regards,<br>The OptiRFP Team</p>
        </div>
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} OptiRFP. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

function renderBetaAnnouncementEmail(data: Record<string, any>): string {
  const { featureName, featureDetails, featureUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Feature Announcement - OptiRFP Beta</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h1 style="color: #7e22ce; margin-top: 0;">New Feature Available in Beta!</h1>
          <p>We're excited to announce a new feature now available to our beta testers: <strong>${featureName || 'Advanced Feature'}</strong></p>
          <div style="background-color: #e8e8e8; border-left: 4px solid #7e22ce; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Feature Details:</strong></p>
            <p style="margin: 10px 0 0;">${featureDetails || 'This new feature enhances your OptiRFP experience with additional capabilities and improved workflows.'}</p>
          </div>
          ${featureUrl ? `
          <div style="margin: 30px 0; text-align: center;">
            <a href="${featureUrl}" style="background-color: #7e22ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Try It Now</a>
          </div>
          ` : ''}
          <p>As always, we value your feedback. Please let us know what you think of this new feature!</p>
          <p>Thank you for being part of our beta program.</p>
          <p>Best regards,<br>The OptiRFP Team</p>
        </div>
        <div style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} OptiRFP. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}
