// Admin notification function — emails the OptiRFP team when a new user signs
// up or a user converts to a paid subscription. Idempotent via
// `admin_notifications_log` (event_type + dedupe_key unique).
//
// Auth modes:
//   1. service-role bearer token  → trusted (used by stripe-webhook)
//   2. user JWT                   → only allowed for { event_type: 'new_user' }
//                                    and the JWT's `sub` MUST match payload.user_id

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const FROM_ADDRESS = 'OptiRFP Alerts <team@updates.optirfp.ai>';
const DEFAULT_RECIPIENTS = ['support@optirfp.ai'];

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function getRecipients(): string[] {
  const raw = Deno.env.get('ADMIN_NOTIFICATION_EMAILS') || '';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_RECIPIENTS;
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NewUserPayload {
  event_type: 'new_user';
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
}

interface NewSubscriberPayload {
  event_type: 'new_subscriber';
  user_id: string;
  email: string;
  plan: string;
  amount?: number; // in cents
  currency?: string;
  interval?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

type Payload = NewUserPayload | NewSubscriberPayload;

function renderEmail(p: Payload): { subject: string; html: string; dedupe_key: string } {
  if (p.event_type === 'new_user') {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    const subject = `🎉 New OptiRFP signup: ${name || p.email}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111">
        <h2 style="margin:0 0 16px">New user signup</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:6px 0;color:#666">Name</td><td>${escapeHtml(name || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Email</td><td>${escapeHtml(p.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Company</td><td>${escapeHtml(p.company_name || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#666">User ID</td><td><code>${escapeHtml(p.user_id)}</code></td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="https://optirfp.ai/admin/users" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Open admin → Users</a>
        </p>
      </div>`;
    return { subject, html, dedupe_key: p.user_id };
  }

  const amountStr =
    typeof p.amount === 'number'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: (p.currency || 'USD').toUpperCase(),
        }).format(p.amount / 100)
      : '—';
  const subject = `💰 New OptiRFP subscriber: ${p.plan} (${p.email})`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111">
      <h2 style="margin:0 0 16px">New paid subscriber</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Email</td><td>${escapeHtml(p.email)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Plan</td><td><strong>${escapeHtml(p.plan)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Amount</td><td>${escapeHtml(amountStr)} / ${escapeHtml(p.interval || 'period')}</td></tr>
        <tr><td style="padding:6px 0;color:#666">User ID</td><td><code>${escapeHtml(p.user_id)}</code></td></tr>
        <tr><td style="padding:6px 0;color:#666">Stripe sub</td><td><code>${escapeHtml(p.stripe_subscription_id || '—')}</code></td></tr>
      </table>
      <p style="margin-top:24px">
        <a href="https://optirfp.ai/admin/billing" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">Open admin → Billing</a>
      </p>
    </div>`;
  return { subject, html, dedupe_key: p.stripe_subscription_id || p.user_id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // ---- Auth ----
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let isServiceRole = false;
  let jwtUserId: string | null = null;
  if (token && token === SERVICE_ROLE_KEY) {
    isServiceRole = true;
  } else if (token) {
    try {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await userClient.auth.getUser();
      if (!error && data.user) jwtUserId = data.user.id;
    } catch (_) {
      // ignore
    }
  }
  if (!isServiceRole && !jwtUserId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ---- Payload ----
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (
    !payload ||
    (payload.event_type !== 'new_user' && payload.event_type !== 'new_subscriber') ||
    !payload.user_id ||
    !payload.email
  ) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // User-JWT mode: only allow notifying about themselves on signup.
  if (!isServiceRole) {
    if (payload.event_type !== 'new_user' || payload.user_id !== jwtUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const recipients = getRecipients();
  const { subject, html, dedupe_key } = renderEmail(payload);

  // Idempotency: reserve the dedupe slot first.
  const { data: inserted, error: insertErr } = await admin
    .from('admin_notifications_log')
    .insert({
      event_type: payload.event_type,
      dedupe_key,
      recipient_emails: recipients,
      subject,
      payload: payload as unknown as Record<string, unknown>,
      status: 'pending',
    })
    .select('id')
    .maybeSingle();

  if (insertErr) {
    // Unique-constraint violation → already sent. Treat as success.
    if ((insertErr as any).code === '23505') {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('admin_notifications_log insert failed:', insertErr);
    return new Response(JSON.stringify({ error: 'Log insert failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const logId = inserted?.id;

  // Send the email.
  if (!resend) {
    await admin
      .from('admin_notifications_log')
      .update({ status: 'failed', error: 'RESEND_API_KEY not configured' })
      .eq('id', logId);
    return new Response(JSON.stringify({ error: 'Email provider not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { error: sendErr } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
    });
    if (sendErr) throw sendErr;
    await admin.from('admin_notifications_log').update({ status: 'sent' }).eq('id', logId);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Resend send failed:', msg);
    await admin
      .from('admin_notifications_log')
      .update({ status: 'failed', error: msg.slice(0, 1000) })
      .eq('id', logId);
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
