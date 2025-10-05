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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { invoiceId, stripeConnectAccountId } = await req.json();
    console.log('Creating Stripe invoice for invoice:', invoiceId);

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      throw invoiceError;
    }

    console.log('Invoice data:', { 
      id: invoice.id, 
      total: invoice.total_amount,
      items_count: invoice.invoice_items?.length 
    });

    // Get client profile
    const { data: clientProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', invoice.client_id)
      .single();

    // Get client auth user for email
    const { data: { user: clientUser } } = await supabaseClient.auth.admin.getUserById(
      invoice.client_id
    );

    const clientEmail = clientUser?.email || '';
    const clientName = clientProfile?.full_name || 'Client';

    console.log('Client info:', { email: clientEmail, name: clientName });

    // Get or create Stripe customer on connected account
    let customerId = null;
    const customers = await stripe.customers.list(
      {
        email: clientEmail,
        limit: 1,
      },
      {
        stripeAccount: stripeConnectAccountId,
      }
    );

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Using existing customer:', customerId);
    } else {
      const customer = await stripe.customers.create(
        {
          email: clientEmail,
          name: clientName,
          metadata: { 
            client_id: invoice.client_id,
            platform: 'BuildEasy'
          },
        },
        {
          stripeAccount: stripeConnectAccountId,
        }
      );
      customerId = customer.id;
      console.log('Created new customer:', customerId);
    }

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create(
      {
        customer: customerId,
        auto_advance: false,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
          invoice_id: invoice.id,
          vat_basis: invoice.vat_basis || 'standard19',
          legal_invoice_number: invoice.legal_invoice_number || '',
          platform: 'BuildEasy'
        },
        footer: invoice.reverse_charge_note || undefined,
      },
      {
        stripeAccount: stripeConnectAccountId,
      }
    );

    console.log('Created Stripe invoice:', stripeInvoice.id);

    // Add line items
    if (invoice.invoice_items && invoice.invoice_items.length > 0) {
      for (const item of invoice.invoice_items) {
        await stripe.invoiceItems.create(
          {
            customer: customerId,
            invoice: stripeInvoice.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_amount: Math.round(Number(item.unit_amount) * 100), // Convert to cents
            metadata: {
              is_material: item.is_material ? 'true' : 'false'
            }
          },
          {
            stripeAccount: stripeConnectAccountId,
          }
        );
        console.log('Added line item:', item.description);
      }
    }

    // Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      stripeInvoice.id,
      {},
      { stripeAccount: stripeConnectAccountId }
    );

    console.log('Finalized invoice, PDF:', finalizedInvoice.invoice_pdf);

    // Update our invoice with Stripe details
    await supabaseClient
      .from('invoices')
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_pdf_url: finalizedInvoice.invoice_pdf,
        stripe_hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
        status: 'sent',
      })
      .eq('id', invoiceId);

    console.log('Updated invoice in database with payment URL');

    return new Response(
      JSON.stringify({
        success: true,
        stripeInvoiceId: finalizedInvoice.id,
        pdfUrl: finalizedInvoice.invoice_pdf,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in stripe-create-invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
