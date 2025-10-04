import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VATWizard from './VATWizard';
import type { VATResult } from '@/utils/vatCalculator';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  onInvoiceCreated?: () => void;
}

const CreateInvoiceModal = ({ 
  isOpen, 
  onClose, 
  quoteRequestId,
  onInvoiceCreated 
}: CreateInvoiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [step, setStep] = useState<'check' | 'vat-wizard' | 'creating'>('check');
  const [quoteData, setQuoteData] = useState<any>(null);
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStripeAndLoadQuote();
    }
  }, [isOpen, quoteRequestId]);

  const checkStripeAndLoadQuote = async () => {
    try {
      setCheckingStripe(true);

      // Get current user and check Stripe status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: vendorProfile, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const vp: any = vendorProfile || {};
      setStripeConnectId(vp.stripe_connect_id || null);
      const isReady = !!(vp.stripe_onboarding_complete && vp.stripe_charges_enabled);
      setStripeReady(isReady);

      if (!isReady) {
        setStep('check');
        setCheckingStripe(false);
        return;
      }

      // Load quote data
      const { data: quoteRequest, error: quoteError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          projects!inner(
            title,
            description,
            location,
            budget_range
          ),
          quotes!inner(
            id,
            total_amount,
            cost_breakdown,
            milestones,
            inclusions,
            exclusions,
            payment_schedule
          )
        `)
        .eq('id', quoteRequestId)
        .eq('status', 'accepted')
        .single();

      if (quoteError) throw quoteError;

      if (!quoteRequest) {
        toast.error('Quote must be accepted before creating invoice');
        onClose();
        return;
      }

      setQuoteData(quoteRequest);
      setStep('vat-wizard');

    } catch (error: any) {
      console.error('Error loading quote:', error);
      toast.error(error.message || 'Failed to load quote data');
      onClose();
    } finally {
      setCheckingStripe(false);
    }
  };

  const handleVATComplete = async (vatResult: VATResult, additionalData: any) => {
    if (!quoteData || !stripeConnectId) return;

    setStep('creating');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the current quote (most recent version)
      const latestQuote = quoteData.quotes[0];

      // Check if invoice already exists for this quote and delete it
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('quote_id', latestQuote.id)
        .maybeSingle();

      if (existingInvoice) {
        // Delete existing invoice items first
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', existingInvoice.id);
        
        // Delete existing invoice
        await supabase
          .from('invoices')
          .delete()
          .eq('id', existingInvoice.id);
        
        console.log('Deleted existing invoice to create new one');
      }

      // Get vendor service fee percentage
      const { data: serviceFeeData } = await supabase
        .rpc('get_vendor_service_fee', { vendor_user_id: user.id });
      
      const serviceFeePercentage = serviceFeeData || 2.0;
      const serviceFeeAmount = vatResult.total * (serviceFeePercentage / 100);
      const vendorPayoutAmount = vatResult.total - serviceFeeAmount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await (supabase as any)
        .from('invoices')
        .insert([{
          vendor_id: user.id,
          client_id: quoteData.client_id,
          quote_id: latestQuote.id,
          quote_version_id: latestQuote.id,
          subtotal_amount: vatResult.subtotal,
          vat_amount: vatResult.vatAmount,
          vat_rate: vatResult.vatRate,
          vat_basis: vatResult.vatBasis,
          total_amount: vatResult.total,
          service_fee_percentage: serviceFeePercentage,
          service_fee_amount: serviceFeeAmount,
          vendor_payout_amount: vendorPayoutAmount,
          currency: 'EUR',
          status: 'draft',
          reverse_charge_note: vatResult.reverseChargeNote || null,
          place_of_supply: additionalData.place_of_supply,
          property_location: additionalData.property_location,
          dwelling_age_years: additionalData.dwelling_age_years,
          materials_percentage: additionalData.materials_percentage,
          property_area_sqm: additionalData.property_area_sqm
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      console.log('Invoice created:', invoice.id);

      // Create invoice items from quote breakdown
      const costBreakdown = latestQuote.cost_breakdown as any[] || [];
      if (costBreakdown.length > 0) {
        const items = costBreakdown.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description || item.item || 'Service',
          quantity: 1,
          unit_amount: item.amount || 0,
          line_total: item.amount || 0,
          is_material: item.type === 'material' || false
        }));

        const { error: itemsError } = await (supabase as any)
          .from('invoice_items')
          .insert(items as any[]);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
          // Don't throw - invoice is created, items are optional
        }
      }

      // Create Stripe invoice
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
        'stripe-create-invoice',
        {
          body: {
            invoiceId: invoice.id,
            stripeConnectAccountId: stripeConnectId
          }
        }
      );

      if (stripeError) {
        console.error('Stripe invoice error:', stripeError);
        toast.error('Invoice created but Stripe sync failed. You can retry from the invoice page.');
      } else {
        console.log('Stripe invoice created:', stripeData);
        toast.success('Invoice created and sent successfully!');
      }

      if (onInvoiceCreated) {
        onInvoiceCreated();
      }

      onClose();

    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Invoice
          </DialogTitle>
        </DialogHeader>

        {checkingStripe && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!checkingStripe && step === 'check' && !stripeReady && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Stripe Connect Required</strong>
                <p className="mt-2">
                  You need to complete Stripe onboarding before creating invoices.
                  Please visit your Business Information page to set up payment collection.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => window.location.href = '/business-information'}>
                Set Up Payments
              </Button>
            </div>
          </div>
        )}

        {!checkingStripe && step === 'vat-wizard' && quoteData && (
          <VATWizard
            amount={quoteData.quotes[0]?.total_amount || 0}
            propertyLocation={quoteData.projects?.location || ''}
            onComplete={handleVATComplete}
            onCancel={onClose}
          />
        )}

        {step === 'creating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Creating your invoice...</p>
            <p className="text-sm text-muted-foreground">
              Calculating VAT and syncing with Stripe
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceModal;
