
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
  // Prefer metadata.plan_slug set during checkout
  const metaSlug = subscription.metadata?.plan_slug;
  if (metaSlug) return metaSlug.toLowerCase();

  const nickname = subscription.items?.data?.[0]?.plan?.nickname || '';
  const lower = nickname.toLowerCase();

  if (lower.includes('enterprise')) return 'enterprise';
  if (lower.includes('business')) return 'business';
  if (lower.includes('growth')) return 'growth';
  return 'starter';
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
      <p><a href="https://ai-proposal-genius.lovable.app/settings" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Invite your team →</a></p>
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
      <p><a href="https://ai-proposal-genius.lovable.app/subscription" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Manage subscription →</a></p>
    </div>`,
  );
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
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`Processing stripe webhook event: ${event.type}`);

    switch (event.type) {
      // ---------------------------------------------------------------
      // CHECKOUT COMPLETED
      // ---------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status !== 'paid') break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planSlug = resolvePlanSlug(subscription);
        const tier = await lookupPricingTier(planSlug);

        const projectLimit = tier?.projects_limit ?? getProjectLimit(planSlug);
        const usersLimit = tier?.users_limit ?? (hasUnlimitedUsers(planSlug) ? -1 : 1);

        console.log('Checkout completed – plan:', planSlug, 'projects:', projectLimit, 'users:', usersLimit);

        const { error } = await supabase.from('subscriptions').upsert({
          user_id: session.client_reference_id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: subscription.status,
          plan_type: planSlug,
          project_limit: projectLimit === -1 ? 999999 : projectLimit,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error storing subscription:', error);
        } else {
          console.log('Subscription stored successfully');
          // Notify about unlimited team if applicable
          if (usersLimit === -1 && session.client_reference_id) {
            await notifyTeamUnlocked(session.client_reference_id, tier?.name ?? planSlug);
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

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            plan_type: planSlug,
            project_limit: projectLimit === -1 ? 999999 : projectLimit,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
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
        } else if (subRow?.user_id) {
          const teamSize = await countOrgMembers(subRow.user_id);
          if (teamSize > 1) {
            await notifyDowngradeWarning(subRow.user_id, teamSize);
          }
        }
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
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
