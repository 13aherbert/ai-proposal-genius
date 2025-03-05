
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import Stripe from 'https://esm.sh/stripe@12.5.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`Processing stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        if (session.payment_status === 'paid') {
          console.log('Payment was successful, fetching subscription details');
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Retrieved subscription:', subscription.id, 'with status:', subscription.status);
          
          const customer = await stripe.customers.retrieve(session.customer);
          console.log('Retrieved customer:', session.customer);
          
          // Get the plan_type from the subscription metadata or product
          let planType = 'starter'; // Default
          if (subscription.items.data[0]?.plan?.nickname) {
            planType = subscription.items.data[0].plan.nickname.toLowerCase();
          }
          console.log('Plan type determined as:', planType);
          
          // Set project limit based on plan
          const projectLimit = planType.includes('pro') ? 30 : 10;
          
          console.log('Updating subscription in database with:', {
            user_id: session.client_reference_id,
            status: subscription.status,
            plan_type: planType,
            project_limit: projectLimit
          });
          
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: session.client_reference_id,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              status: subscription.status,
              plan_type: planType,
              project_limit: projectLimit,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id',
            });
          
          if (error) {
            console.error('Error storing subscription:', error);
          } else {
            console.log('Successfully updated subscription in database');
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Invoice payment failed:', invoice.id);
        
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          const { data: userData, error: userError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();
            
          if (userError) {
            console.error('Error finding user for subscription:', userError);
            break;
          }
          
          console.log('Updating subscription status to:', subscription.status);
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);
            
          if (error) {
            console.error('Error updating subscription status:', error);
          } else {
            console.log('Successfully updated subscription status');
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id, 'with status:', subscription.status);
        
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (userError) {
          console.error('Error finding user for subscription:', userError);
          break;
        }
        
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        console.log('Updating subscription in database with:', {
          status: subscription.status,
          cancel_at_period_end: cancelAtPeriodEnd
        });
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: cancelAtPeriodEnd,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log('Successfully updated subscription');
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);
        
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (userError) {
          console.error('Error finding user for subscription:', userError);
          break;
        }
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (error) {
          console.error('Error updating subscription to canceled:', error);
        } else {
          const { error: trialError } = await supabase
            .from('subscriptions')
            .update({
              plan_type: 'trial',
              project_limit: 3,
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
            
          if (trialError) {
            console.error('Error downgrading to trial:', trialError);
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
    console.error(`Error processing webhook:`, err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
