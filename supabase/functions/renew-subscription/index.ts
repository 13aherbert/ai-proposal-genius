
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  console.log('Renew subscription function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const requestData = await req.json()
    console.log('Request data:', JSON.stringify(requestData))

    const { subscriptionId, customerId } = requestData

    if (!subscriptionId && !customerId) {
      console.error('Missing required parameters: need either subscriptionId or customerId')
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let billingPortalUrl

    // Try to create a billing portal session using the customer ID first (preferred)
    if (customerId) {
      console.log(`Attempting to create billing portal with customer ID: ${customerId}`)
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get('origin')}/subscription`,
        })
        
        billingPortalUrl = session.url
        console.log(`Successfully created billing portal with URL: ${billingPortalUrl}`)
      } catch (stripeError) {
        console.error(`Error creating billing portal with customer ID: ${stripeError.message}`)
        // If customer ID fails, we'll try subscription ID next
      }
    }

    // If billing portal URL isn't set yet and we have a subscription ID, try to get the customer from the subscription
    if (!billingPortalUrl && subscriptionId) {
      console.log(`Attempting to get customer from subscription ID: ${subscriptionId}`)
      try {
        // Get the subscription to find the customer
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        if (subscription && subscription.customer) {
          console.log(`Found customer ${subscription.customer} from subscription`)
          const session = await stripe.billingPortal.sessions.create({
            customer: subscription.customer.toString(),
            return_url: `${req.headers.get('origin')}/subscription`,
          })
          
          billingPortalUrl = session.url
          console.log(`Successfully created billing portal with URL: ${billingPortalUrl}`)
        } else {
          throw new Error('No customer associated with this subscription')
        }
      } catch (stripeError) {
        console.error(`Error retrieving subscription or creating portal: ${stripeError.message}`)
        throw stripeError
      }
    }

    if (!billingPortalUrl) {
      throw new Error('Could not create billing portal - no valid customer ID found')
    }

    // Return the URL to the client
    return new Response(
      JSON.stringify({ url: billingPortalUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`Error in renew-subscription function: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
