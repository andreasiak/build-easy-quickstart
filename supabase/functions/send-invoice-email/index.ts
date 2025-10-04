import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId } = await req.json();
    console.log('Sending invoice email for:', invoiceId);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        id,
        invoice_number,
        legal_invoice_number,
        total_amount,
        vat_amount,
        subtotal_amount,
        stripe_pdf_url,
        client_id,
        vendor_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    // Get client email
    const { data: { user: clientUser } } = await supabaseClient.auth.admin.getUserById(
      invoice.client_id
    );

    if (!clientUser?.email) {
      throw new Error('Client email not found');
    }

    // Get vendor business name
    const { data: vendorProfile } = await supabaseClient
      .from('vendor_profiles')
      .select('business_name')
      .eq('user_id', invoice.vendor_id)
      .single();

    const vendorName = vendorProfile?.business_name || 'Your Vendor';
    const invoiceNumber = invoice.legal_invoice_number || invoice.invoice_number;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "BuildEasy <onboarding@resend.dev>",
      to: [clientUser.email],
      subject: `New Invoice ${invoiceNumber} from ${vendorName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Invoice Received</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You have received a new invoice from <strong>${vendorName}</strong>.</p>
                
                <div class="invoice-details">
                  <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                  <p><strong>Subtotal:</strong> €${Number(invoice.subtotal_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p><strong>VAT:</strong> €${Number(invoice.vat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <div class="amount">€${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>

                ${invoice.stripe_pdf_url ? `
                  <p>You can view and download your invoice using the button below:</p>
                  <a href="${invoice.stripe_pdf_url}" class="button">View Invoice PDF</a>
                ` : ''}

                <p>Please log in to your BuildEasy dashboard to view the full invoice details and manage payment.</p>
                
                <p>If you have any questions about this invoice, please contact ${vendorName} directly.</p>
              </div>
              <div class="footer">
                <p>This is an automated email from BuildEasy.</p>
                <p>© 2025 BuildEasy. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      throw emailError;
    }

    console.log('Invoice email sent successfully to:', clientUser.email);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-invoice-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
