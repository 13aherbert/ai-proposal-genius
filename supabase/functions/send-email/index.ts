
// Import React for the email templates
import React from 'https://esm.sh/react@18.2.0';
import { renderAsync } from 'https://esm.sh/@react-email/render@0.0.10';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// Import email templates
import WelcomeEmail from './templates/Welcome.tsx';
import PasswordResetEmail from './templates/PasswordReset.tsx';
import PasswordChangedEmail from './templates/PasswordChanged.tsx';
import SupportEmail from './templates/Support.tsx';
import SupportResponseEmail from './templates/SupportResponse.tsx';
import SupportConfirmationEmail from './templates/SupportConfirmation.tsx';
import BetaInviteEmail from './templates/BetaInvite.tsx';
import BetaAnnouncementEmail from './templates/BetaAnnouncement.tsx';

// Import shared CORS utilities
import { corsHeaders, handleCors, addCorsHeaders } from './_shared/cors.ts';

// Create Resend client using API key from environment variable
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// For development/testing - the email allowed by Resend in testing mode
const RESEND_VERIFIED_EMAIL = 'optirfp@gmail.com';

// Company email configuration
const COMPANY_EMAIL_DOMAIN = 'updates.optirfp.ai';
const FROM_ACCOUNT = `OptiRFP <team@${COMPANY_EMAIL_DOMAIN}>`;
const FROM_SUPPORT = `OptiRFP Support <support@${COMPANY_EMAIL_DOMAIN}>`;
const FROM_MARKETING = `OptiRFP <marketing@${COMPANY_EMAIL_DOMAIN}>`;

// Map template types to sender addresses
const TEMPLATE_SENDER_MAP: Record<string, string> = {
  welcome: FROM_ACCOUNT,
  password_reset: FROM_ACCOUNT,
  password_changed: FROM_ACCOUNT,
  support: FROM_SUPPORT,
  support_response: FROM_SUPPORT,
  support_confirmation: FROM_SUPPORT,
  beta_invite: FROM_MARKETING,
  beta_announcement: FROM_MARKETING,
};

// Track recently processed requests to prevent duplicates
const processedRequests = new Map<string, number>();
const DUPLICATE_REQUEST_WINDOW_MS = 10000; // 10 seconds

// Handler function for processing requests
Deno.serve(async (req) => {
  console.log('Received request to send-email function');
  
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Authenticate caller — must be a signed-in user OR an internal service-role call
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  let isAuthorized = false;
  let isServiceRole = false;
  let callerUserId: string | null = null;
  let callerEmail: string | null = null;
  let callerOrgId: string | null = null;
  if (token && serviceRoleKey && token === serviceRoleKey) {
    isAuthorized = true;
    isServiceRole = true;
  } else if (token) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        isAuthorized = true;
        callerUserId = user.id;
        callerEmail = (user.email || '').toLowerCase();
        // Lookup caller's current organization for recipient allowlist
        const svc = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);
        const { data: profile } = await svc
          .from('profiles')
          .select('current_organization_id')
          .eq('profile_id', user.id)
          .maybeSingle();
        callerOrgId = (profile as any)?.current_organization_id ?? null;
      }
    } catch (e) {
      console.error('JWT validation error:', e);
    }
  }
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    // Get request payload
    const payload = await req.json();
    console.log('Email request payload:', payload);

    // Validate required fields
    if (!payload.to || !Array.isArray(payload.to) || !payload.to.length) {
      console.error('Missing or invalid "to" field');
      throw new Error('Missing or invalid "to" field');
    }

    if (!payload.subject) {
      console.error('Missing "subject" field');
      throw new Error('Missing "subject" field');
    }
    
    // Create a unique request ID to detect duplicates
    const requestId = `${payload.to.join(',')}_${payload.subject}_${payload.templateType || 'direct'}`;
    
    // Check if this is a duplicate request within the time window
    const lastProcessed = processedRequests.get(requestId);
    if (lastProcessed && (Date.now() - lastProcessed) < DUPLICATE_REQUEST_WINDOW_MS) {
      console.log(`Duplicate request detected for ${requestId}. Skipping.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: null,
          message: 'Duplicate request detected and skipped',
          isDuplicate: true
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Record this request as processed
    processedRequests.set(requestId, Date.now());
    
    // Clean up old entries from the processed requests map
    const now = Date.now();
    for (const [key, timestamp] of processedRequests.entries()) {
      if (now - timestamp > DUPLICATE_REQUEST_WINDOW_MS) {
        processedRequests.delete(key);
      }
    }

    let html = '';
    
    // Check if we're using a template or direct HTML
    if (payload.templateType && payload.templateData) {
      // Render the appropriate React email template based on templateType
      const templateType = payload.templateType;
      const templateData = payload.templateData;
      
      console.log(`Rendering ${templateType} template with data:`, templateData);
      
      try {
        switch (templateType) {
          case 'welcome':
            html = await renderAsync(
              React.createElement(WelcomeEmail, templateData)
            );
            break;
          case 'password_reset':
            html = await renderAsync(
              React.createElement(PasswordResetEmail, templateData)
            );
            break;
          case 'password_changed':
            html = await renderAsync(
              React.createElement(PasswordChangedEmail, templateData)
            );
            break;
          case 'support':
            html = await renderAsync(
              React.createElement(SupportEmail, templateData)
            );
            break;
          case 'support_response':
            html = await renderAsync(
              React.createElement(SupportResponseEmail, templateData)
            );
            break;
          case 'support_confirmation':
            html = await renderAsync(
              React.createElement(SupportConfirmationEmail, templateData)
            );
            break;
          case 'beta_invite':
            console.log('Rendering beta_invite template');
            html = await renderAsync(
              React.createElement(BetaInviteEmail, templateData)
            );
            break;
          case 'beta_announcement':
            html = await renderAsync(
              React.createElement(BetaAnnouncementEmail, templateData)
            );
            break;
          default:
            console.error(`Unsupported template type: ${templateType}`);
            throw new Error(`Unsupported template type: ${templateType}`);
        }
        console.log('Template rendered successfully');
      } catch (templateError) {
        console.error('Error rendering template:', templateError);
        const templateErrorMessage = templateError instanceof Error ? templateError.message : String(templateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Template rendering failed: ${templateErrorMessage}` 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    } else if (payload.html) {
      // Use direct HTML if provided
      html = payload.html;
    } else {
      console.error('Missing template type/data or direct HTML content');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing template type/data or direct HTML content' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Always use the actual recipient email addresses
    // We completely disable the test mode redirection
    const recipients = payload.to;
    console.log('Using email recipients:', recipients);
    
    // Send the email via Resend
    const emailOptions = {
      from: payload.from || TEMPLATE_SENDER_MAP[payload.templateType] || FROM_ACCOUNT,
      to: recipients,
      subject: payload.subject,
      html: html,
      ...(payload.replyTo && { reply_to: payload.replyTo }),
    };

    console.log('Sending email with options:', {
      to: emailOptions.to,
      subject: emailOptions.subject,
      from: emailOptions.from,
      replyTo: emailOptions.reply_to,
    });
    
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email sending failed: ${error.message}` 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Email sent successfully:', data);
    
    // Add response data
    const responseData = {
      success: true,
      id: data?.id,
      requestId: requestId,
      sentTo: recipients
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
