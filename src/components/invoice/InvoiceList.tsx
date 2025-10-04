import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, ExternalLink, Loader2, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  legal_invoice_number: string | null;
  total_amount: number;
  subtotal_amount: number;
  vat_amount: number;
  vat_rate: number;
  status: string;
  created_at: string;
  stripe_pdf_url: string | null;
  vendor_id: string;
  client_id: string;
  vendor_signed_at: string | null;
  client_signed_at: string | null;
}

interface InvoiceListProps {
  userRole: 'vendor' | 'client';
  userId: string;
}

const InvoiceList = ({ userRole, userId }: InvoiceListProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [signModal, setSignModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [requiredName, setRequiredName] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [userId, userRole]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const filterColumn = userRole === 'vendor' ? 'vendor_id' : 'client_id';
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq(filterColumn, userId)
        .order('created_at', { ascending: false });

      const rows = (data as any[]) || [];
      setInvoices(rows.map((r: any) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        legal_invoice_number: r.legal_invoice_number ?? null,
        total_amount: Number(r.total_amount ?? 0),
        subtotal_amount: Number(r.subtotal_amount ?? 0),
        vat_amount: Number(r.vat_amount ?? 0),
        vat_rate: Number(r.vat_rate ?? 0),
        status: r.status ?? 'draft',
        created_at: r.created_at,
        stripe_pdf_url: r.stripe_pdf_url ?? null,
        vendor_id: r.vendor_id,
        client_id: r.client_id,
        vendor_signed_at: r.vendor_signed_at ?? null,
        client_signed_at: r.client_signed_at ?? null,
      })) );
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      sent: 'secondary',
      paid: 'default',
      payment_failed: 'destructive',
      voided: 'destructive',
    };
    return variants[status] || 'outline';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      payment_failed: 'Payment Failed',
      voided: 'Voided',
    };
    return labels[status] || status;
  };

  const handleSignInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    
    // Get vendor business name
    if (userRole === 'vendor') {
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('business_name')
        .eq('user_id', userId)
        .maybeSingle();
      setRequiredName(vendorProfile?.business_name || '');
    }
    
    setSignModal(true);
  };

  const processSignature = async () => {
    if (!selectedInvoice || !signatureName.trim() || !requiredName) return;

    if (signatureName.trim().toLowerCase() !== requiredName.toLowerCase()) {
      toast.error(`Please enter exactly: ${requiredName}`);
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      const signatureUrl = `signature-${userId}-${Date.now()}`;
      
      const updateData: any = {
        vendor_signature_url: signatureUrl,
        vendor_signed_at: now,
        status: selectedInvoice.client_signed_at ? 'sent' : 'awaiting_client_signature'
      };

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      toast.success('Invoice signed successfully!');
      setSignModal(false);
      setSignatureName('');
      setSelectedInvoice(null);
      
      // Refresh invoices
      await fetchInvoices();
    } catch (error: any) {
      console.error('Error signing:', error);
      toast.error('Failed to sign invoice');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices
        </CardTitle>
        <CardDescription>
          {userRole === 'vendor' 
            ? 'Invoices you have issued to clients'
            : 'Invoices from your projects'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm">
                      {invoice.legal_invoice_number || invoice.invoice_number}
                    </span>
                    <Badge variant={getStatusBadge(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    €{invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {' • '}
                    {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Subtotal: €{invoice.subtotal_amount.toFixed(2)} + VAT ({invoice.vat_rate}%): €{invoice.vat_amount.toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {invoice.stripe_pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.stripe_pdf_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  )}
                  
                  {userRole === 'vendor' && !invoice.vendor_signed_at && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSignInvoice(invoice)}
                    >
                      <PenTool className="h-4 w-4 mr-1" />
                      Sign Invoice
                    </Button>
                  )}
                  
                  {userRole === 'client' && invoice.status === 'sent' && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          // Call edge function to create/get payment URL
                          const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
                            'stripe-create-invoice',
                            {
                              body: {
                                action: 'get-payment-url',
                                invoiceId: invoice.id
                              }
                            }
                          );

                          if (paymentError) throw paymentError;

                          if (paymentData?.hostedInvoiceUrl) {
                            window.open(paymentData.hostedInvoiceUrl, '_blank');
                            toast.success('Opening payment page...');
                          } else {
                            toast.error('Payment URL not available. Please contact support.');
                          }
                        } catch (error: any) {
                          console.error('Payment error:', error);
                          toast.error('Failed to open payment page. Please try again or contact support.');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Signature Modal */}
      <Dialog open={signModal} onOpenChange={setSignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To sign this invoice, please enter your business name exactly as it appears in your profile:
            </p>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Required name: {requiredName}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signature">Your Signature</Label>
              <Input
                id="signature"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your business name"
                disabled={processing}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSignModal(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={processSignature} disabled={processing || !signatureName.trim()}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Confirm Signature'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InvoiceList;
