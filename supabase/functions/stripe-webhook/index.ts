
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import Stripe from 'https://esm.sh/stripe@12.5.0';
import { getProjectLimit, hasUnlimitedUsers, SUBSCRIPTION_PLAN_LIMITS } from '../_shared/subscription-limits.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve plan slug from Stripe subscription nickname or metadata */
function resolvePlanSlug(subscription: any): string {
  const metaSlug = subscription.metadata?.plan_slug;
  if (metaSlug) return metaSlug.toLowerCase();

  const nickname = subscription.items?.data?.[0]?.plan?.nickname || '';
  const lower = nickname.toLowerCase();

  if (lower.includes('enterprise')) return 'enterprise';
  if (lower.includes('business')) return 'business';
  if (lower.includes('growth')) return 'growth';
  return 'starter';
}

/** Resolve billing interval from Stripe subscription */
function resolveBillingInterval(subscription: any): 'monthly' | 'annual' {
  const interval = subscription.items?.data?.[0]?.plan?.interval;
  return interval === 'year' ? 'annual' : 'monthly';
}

/** Look up pricing_tiers row for a given slug */
async function lookupPricingTier(slug: string) {
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('projects_limit, users_limit, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) console.error('Error looking up pricing tier:', error);
  return data;
}

/** Count active org members for a user's current organization */
async function countOrgMembers(userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (!profile?.current_organization_id) return 1;

  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', profile.current_organization_id)
    .eq('status', 'active');

  return count ?? 1;
}

/** Get user email from auth.users via admin API */
async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

/** Fire-and-forget email via the send-email edge function */
async function sendInternalEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ to: [to], subject, html }),
    });
    if (!res.ok) console.error('send-email failed:', await res.text());
  } catch (e) {
    console.error('send-email error:', e);
  }
}

/** Fire-and-forget admin notification (new subscriber) */
async function notifyAdminNewSubscriber(opts: {
  userId: string;
  email: string;
  plan: string;
  amount?: number;
  currency?: string;
  interval?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        event_type: 'new_subscriber',
        user_id: opts.userId,
        email: opts.email,
        plan: opts.plan,
        amount: opts.amount,
        currency: opts.currency,
        interval: opts.interval,
        stripe_subscription_id: opts.stripeSubscriptionId,
        stripe_customer_id: opts.stripeCustomerId,
      }),
    });
    if (!res.ok) console.error('admin-notify (subscriber) failed:', await res.text());
  } catch (e) {
    console.error('admin-notify (subscriber) error:', e);
  }
}

/** Send "team unlocked" notification */
async function notifyTeamUnlocked(userId: string, tierName: string) {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendInternalEmail(
    email,
    `🎉 Invite Your Team – Unlimited Users on ${tierName}`,
    `<div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2>Your team just got bigger</h2>
      <p>You've upgraded to <strong>${tierName}</strong>. You can now invite
      <strong>unlimited team members</strong> to collaborate on proposals.</p>
      <p><a href="https://optirfp.ai/settings" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Invite your team →</a></p>
    </div>`,
  );
}

/** Send downgrade warning when team size exceeds Starter limit */
async function notifyDowngradeWarning(userId: string, teamSize: number) {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendInternalEmail(
    email,
    '⚠️ Action Required – Your Plan Now Supports 1 User',
    `<div style="font-family:sans-serif;max-width:560px;margin:auto">
      <h2>Your subscription has changed</h2>
      <p>Your plan is now <strong>Starter</strong>, which supports <strong>1 user</strong>.
      You currently have <strong>${teamSize} team members</strong>.</p>
      <p>You have <strong>30 days</strong> to either reduce your team size or upgrade to a paid plan.
      After that, additional team members will lose access.</p>
      <p><a href="https://optirfp.ai/subscription" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Manage subscription →</a></p>
    </div>`,
  );
}

/** Sync organization subscription_tier to match the subscription plan */
async function syncOrganizationTier(userId: string, planSlug: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!profile?.current_organization_id) {
      console.log('No current_organization_id for user', userId);
      return;
    }

    const orgId = profile.current_organization_id;
    const isEnterprise = planSlug === 'enterprise';
    const tier = await lookupPricingTier(planSlug);

    const updatePayload: Record<string, any> = {
      subscription_tier: planSlug,
      max_projects: isEnterprise ? -1 : (tier?.projects_limit ?? getProjectLimit(planSlug)),
      max_users: isEnterprise ? -1 : (tier?.users_limit ?? (hasUnlimitedUsers(planSlug) ? -1 : 1)),
      updated_at: new Date().toISOString(),
    };

    if (isEnterprise) {
      updatePayload.sso_enabled = true;
    }

    const { error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId);

    if (error) {
      console.error('Error syncing organization tier:', error);
    } else {
      console.log(`Synced org ${orgId} to tier ${planSlug}`);
    }
  } catch (e) {
    console.error('syncOrganizationTier error:', e);
  }
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      try {
        await supabase.from('error_logs').insert({
          severity: 'critical',
          source: 'edge:stripe-webhook',
          message: `Signature verification failed: ${err.message}`.slice(0, 2000),
          context: { stage: 'signature_verification' },
          url: req.url,
          user_agent: req.headers.get('user-agent'),
        });
      } catch {}
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`Processing stripe webhook event: ${event.type}`);

    switch (event.type) {
      // ---------------------------------------------------------------
      // CHECKOUT COMPLETED
      // ---------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object;

        // -----------------------------------------------------------
        // LIFETIME DEAL (one-time payment, no subscription)
        // -----------------------------------------------------------
        if (session.mode === 'payment' && session.metadata?.lifetime_code_id) {
          if (session.payment_status !== 'paid') {
            console.log('Lifetime checkout not paid yet, skipping:', session.id);
            break;
          }

          const codeId = session.metadata.lifetime_code_id as string;
          const codeStr = (session.metadata.lifetime_code as string) ?? '';
          const planSlug = ((session.metadata.plan_slug as string) ?? 'growth').toLowerCase();
          const userId =
            (session.client_reference_id as string | null) ||
            (session.metadata.user_id as string | undefined) ||
            null;

          if (!userId) {
            console.error('Lifetime checkout missing user id', session.id);
            break;
          }

          // Atomically claim a redemption slot
          const { data: claimed, error: claimErr } = await supabase.rpc(
            'claim_lifetime_code_slot',
            { _code_id: codeId },
          );

          if (claimErr || !claimed) {
            console.error('Could not claim lifetime slot, refunding:', claimErr);
            try {
              if (session.payment_intent) {
                await stripe.refunds.create({
                  payment_intent: session.payment_intent as string,
                });
              }
            } catch (refundErr) {
              console.error('Refund failed:', refundErr);
            }
            break;
          }

          // Get amount from session
          const amount = session.amount_total ?? null;

          // Idempotent insert
          const { data: redemption, error: redErr } = await supabase
            .from('lifetime_deal_redemptions')
            .upsert(
              {
                code_id: codeId,
                user_id: userId,
                email: session.customer_details?.email ?? null,
                stripe_customer_id: (session.customer as string) ?? null,
                stripe_payment_intent_id: (session.payment_intent as string) ?? null,
                stripe_checkout_session_id: session.id,
                amount_paid_cents: amount,
                currency: session.currency ?? 'usd',
              },
              { onConflict: 'stripe_checkout_session_id' },
            )
            .select('id')
            .maybeSingle();

          if (redErr) {
            console.error('Error inserting lifetime redemption:', redErr);
          }

          const tier = await lookupPricingTier(planSlug);
          const projectLimit = tier?.projects_limit ?? getProjectLimit(planSlug);

          const { error: subErr } = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: null,
              status: 'active',
              plan_type: planSlug,
              project_limit: projectLimit === -1 ? 999999 : projectLimit,
              billing_interval: 'lifetime',
              current_period_end: null,
              cancel_at_period_end: false,
              is_lifetime: true,
              lifetime_redemption_id: redemption?.id ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );

          if (subErr) {
            console.error('Error storing lifetime subscription:', subErr);
          } else {
            console.log('Lifetime subscription stored for user:', userId);
            await syncOrganizationTier(userId, planSlug);
            const email = await getUserEmail(userId);
            if (email) {
              await sendInternalEmail(
                email,
                `🎉 Welcome to ${tier?.name ?? 'Growth'} — for life`,
                `<div style="font-family:sans-serif;max-width:560px;margin:auto">
                  <h2>You're in. For good.</h2>
                  <p>Your one-time payment is complete. You now have <strong>${tier?.name ?? 'Growth'}</strong> access on OptiRFP — permanently. No subscription, no renewals.</p>
                  <p><a href="https://optirfp.ai/dashboard" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Go to your dashboard →</a></p>
                </div>`,
              );
            }
          }
          console.log('Lifetime code redeemed:', codeStr, 'by', userId);
          break;
        }

        // -----------------------------------------------------------
        // STANDARD SUBSCRIPTION CHECKOUT
        // -----------------------------------------------------------
        // NOTE: do not gate on session.payment_status — trial subscriptions
        // arrive as 'no_payment_required' and we still need to write the row.
        if (!session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planSlug = resolvePlanSlug(subscription);
        const tier = await lookupPricingTier(planSlug);

        const projectLimit = tier?.projects_limit ?? getProjectLimit(planSlug);
        const usersLimit = tier?.users_limit ?? (hasUnlimitedUsers(planSlug) ? -1 : 1);

        // Resolve the Supabase user id from client_reference_id, falling back to
        // subscription metadata (older sessions, manually created subs, etc.).
        const userId =
          (session.client_reference_id as string | null) ||
          (subscription.metadata?.user_id as string | undefined) ||
          null;

        if (!userId) {
          console.error('checkout.session.completed: no user_id resolvable from session', session.id);
          break;
        }

        // Don't overwrite a lifetime entitlement
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('is_lifetime')
          .eq('user_id', userId)
          .maybeSingle();
        if (existing?.is_lifetime) {
          console.log('User has lifetime entitlement, skipping subscription overwrite:', userId);
          break;
        }

        console.log('Checkout completed – plan:', planSlug, 'projects:', projectLimit, 'users:', usersLimit, 'user:', userId);

        const billingInterval = resolveBillingInterval(subscription);

        const { error } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: subscription.status,
          plan_type: planSlug,
          project_limit: projectLimit === -1 ? 999999 : projectLimit,
          billing_interval: billingInterval,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error storing subscription:', error);
        } else {
          console.log('Subscription stored successfully');
          // Sync org tier
          await syncOrganizationTier(userId, planSlug);
          // Notify admins of new paid subscriber
          {
            const email = await getUserEmail(userId);
            const item = subscription.items?.data?.[0];
            if (email) {
              await notifyAdminNewSubscriber({
                userId,
                email,
                plan: tier?.name ?? planSlug,
                amount: item?.price?.unit_amount ?? undefined,
                currency: item?.price?.currency ?? undefined,
                interval: item?.price?.recurring?.interval ?? billingInterval,
                stripeSubscriptionId: String(session.subscription),
                stripeCustomerId: session.customer ? String(session.customer) : undefined,
              });
            }
          }
          // Notify about unlimited team if applicable
          if (usersLimit === -1) {
            await notifyTeamUnlocked(userId, tier?.name ?? planSlug);
          }
        }
        break;
      }

      // ---------------------------------------------------------------
      // INVOICE PAYMENT FAILED
      // ---------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | null;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: subscription.status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) console.error('Error updating subscription status:', error);
        else console.log('Updated subscription status to', subscription.status);
        break;
      }

      // ---------------------------------------------------------------
      // SUBSCRIPTION UPDATED (plan change / cancel toggle)
      // ---------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const planSlug = resolvePlanSlug(subscription);
        const tier = await lookupPricingTier(planSlug);

        const projectLimit = tier?.projects_limit ?? getProjectLimit(planSlug);
        const usersLimit = tier?.users_limit ?? (hasUnlimitedUsers(planSlug) ? -1 : 1);

        console.log('Subscription updated – plan:', planSlug, 'status:', subscription.status);

        const billingInterval = resolveBillingInterval(subscription);

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            plan_type: planSlug,
            project_limit: projectLimit === -1 ? 999999 : projectLimit,
            billing_interval: billingInterval,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        }

        // Sync org tier
        {
          const { data: subRow2 } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();
          if (subRow2?.user_id) {
            await syncOrganizationTier(subRow2.user_id, planSlug);
          }
        }

        // Downgrade warning: if moving to starter and team > 1
        if (usersLimit !== -1) {
          const { data: subRow } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();

          if (subRow?.user_id) {
            const teamSize = await countOrgMembers(subRow.user_id);
            if (teamSize > 1) {
              await notifyDowngradeWarning(subRow.user_id, teamSize);
            }
          }
        }
        break;
      }

      // ---------------------------------------------------------------
      // SUBSCRIPTION DELETED (canceled)
      // ---------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        const { data: subRow } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        // Downgrade to starter
        const starterLimit = SUBSCRIPTION_PLAN_LIMITS.starter.projects;

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'starter',
            project_limit: starterLimit,
            stripe_subscription_id: null,
            current_period_end: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error downgrading to starter:', error);
        }
        
        // Sync org tier to starter
        if (subRow?.user_id) {
          await syncOrganizationTier(subRow.user_id, 'starter');
          const teamSize = await countOrgMembers(subRow.user_id);
          if (teamSize > 1) {
            await notifyDowngradeWarning(subRow.user_id, teamSize);
          }
        }
        break;
      }

      // ---------------------------------------------------------------
      // CHARGE REFUNDED — handle lifetime deal refunds
      // ---------------------------------------------------------------
      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent as string | null;
        if (!paymentIntentId) break;

        const { data: redemption } = await supabase
          .from('lifetime_deal_redemptions')
          .select('id, user_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (!redemption) break;

        await supabase
          .from('lifetime_deal_redemptions')
          .update({ refunded_at: new Date().toISOString() })
          .eq('id', redemption.id);

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'starter',
            project_limit: SUBSCRIPTION_PLAN_LIMITS.starter.projects,
            billing_interval: null,
            is_lifetime: false,
            lifetime_redemption_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', redemption.user_id)
          .eq('lifetime_redemption_id', redemption.id);

        await syncOrganizationTier(redemption.user_id, 'starter');
        console.log('Lifetime refund processed for user:', redemption.user_id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    try {
      await supabase.from('error_logs').insert({
        severity: 'critical',
        source: 'edge:stripe-webhook',
        message: `Webhook handler failed: ${err?.message ?? String(err)}`.slice(0, 2000),
        context: { stack: err?.stack ?? null, signature_present: !!req.headers.get('stripe-signature') },
        url: req.url,
        user_agent: req.headers.get('user-agent'),
      });
    } catch (logErr) {
      console.error('Failed to write error_logs:', logErr);
    }
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
