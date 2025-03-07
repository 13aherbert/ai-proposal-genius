
// Import React for the email templates
import React from 'react';
import { renderAsync } from '@react-email/render';
import { Resend } from 'resend';

// Import email templates
import WelcomeEmail from './templates/Welcome.tsx';
import PasswordResetEmail from './templates/PasswordReset.tsx';
import PasswordChangedEmail from './templates/PasswordChanged.tsx';
import SupportEmail from './templates/Support.tsx';
import SupportResponseEmail from './templates/SupportResponse.tsx';
import SupportConfirmationEmail from './templates/SupportConfirmation.tsx';
import BetaInviteEmail from './templates/BetaInvite.tsx';
import BetaAnnouncementEmail from './templates/BetaAnnouncement.tsx';

// Define CORS headers directly in this file to ensure they're applied correctly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Create Resend client using API key from environment variable
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Handler function for processing requests
Deno.serve(async (req) => {
  console.log('Received request to send-email function');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS headers');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

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
        throw new Error(`Template rendering failed: ${templateError.message}`);
      }
    } else if (payload.html) {
      // Use direct HTML if provided
      html = payload.html;
    } else {
      console.error('Missing template type/data or direct HTML content');
      throw new Error('Missing template type/data or direct HTML content');
    }

    // Send the email via Resend
    const emailOptions = {
      from: payload.from || 'OptiRFP <noreply@example.com>', // Replace with your verified domain
      to: payload.to,
      subject: payload.subject,
      html: html,
      ...(payload.replyTo && { reply_to: payload.replyTo }),
    };

    console.log('Sending email with options:', {
      to: emailOptions.to,
      subject: emailOptions.subject,
      replyTo: emailOptions.reply_to,
    });

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        id: data?.id,
      }),
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
