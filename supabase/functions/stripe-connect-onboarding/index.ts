import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { action, accountId, refreshUrl, returnUrl } = await req.json();
    // Enforce HTTPS redirect URLs for Stripe in live mode; fallback to FRONTEND_URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
    const ensureHttps = (url: string | undefined, fallbackPath: string) => {
      try {
        if (url && url.startsWith('https://')) return url;
      } catch (_) {}
      if (frontendUrl) return `${frontendUrl}${fallbackPath}`;
      // As a last resort, allow provided URL even if not https (test mode)
      return url || fallbackPath;
    };
    const safeRefreshUrl = ensureHttps(refreshUrl, '/business-information?stripe_refresh=true');
    const safeReturnUrl = ensureHttps(returnUrl, '/business-information?stripe_complete=true');
    console.log('Stripe Connect action:', action, 'for user:', user.id, { accountId, safeRefreshUrl, safeReturnUrl });

    if (action === 'create') {
      // Get vendor profile to get email
      const { data: vendorProfile } = await supabaseClient
        .from('vendor_profiles')
        .select('business_name, email')
        .eq('user_id', user.id)
        .single();

      // Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CY', // Cyprus
        email: vendorProfile?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        metadata: {
          vendor_id: user.id,
          business_name: vendorProfile?.business_name || 'Unknown'
        }
      });

      console.log('Created Stripe account:', account.id);

      // Store connect ID
      await supabaseClient
        .from('vendor_profiles')
        .update({
          stripe_connect_id: account.id,
          stripe_onboarding_started_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: safeRefreshUrl,
        return_url: safeReturnUrl,
        type: 'account_onboarding',
      });

      console.log('Created account link for onboarding');

      return new Response(
        JSON.stringify({ url: accountLink.url, accountId: account.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'refresh') {
      // Refresh onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: safeRefreshUrl,
        return_url: safeReturnUrl,
        type: 'account_onboarding',
      });

      console.log('Refreshed account link');

      return new Response(
        JSON.stringify({ url: accountLink.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'check-status') {
      // Check account status
      const account = await stripe.accounts.retrieve(accountId);

      console.log('Account status:', {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      });

      await supabaseClient
        .from('vendor_profiles')
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
          stripe_onboarding_complete: account.details_submitted,
          stripe_onboarding_completed_at: account.details_submitted 
            ? new Date().toISOString() 
            : null
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'create-login-link') {
      // Create login link for vendor to access their Stripe dashboard
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      console.log('Created login link');

      return new Response(
        JSON.stringify({ url: loginLink.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    // Improve error visibility and map common Stripe errors to actionable messages
    const stripeMessage = error?.raw?.message || error?.message || 'Unknown error';
    let clientMessage = stripeMessage;

    if (stripeMessage.includes('signed up for Connect')) {
      clientMessage = 'Stripe Connect is not enabled for this account. Enable Connect (Test mode is fine) in your Stripe Dashboard and try again.';
    } else if (error?.code === 'api_key_expired' || stripeMessage.includes('Expired API Key')) {
      clientMessage = 'Stripe API key expired. Please update STRIPE_SECRET_KEY in Supabase secrets.';
    }

    console.error('Error in stripe-connect-onboarding:', error);
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

});
