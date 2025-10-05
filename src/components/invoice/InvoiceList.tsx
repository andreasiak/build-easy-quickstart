import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, ExternalLink, Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  legal_invoice_number: string;
  total_amount: number;
  vat_amount: number;
  subtotal_amount: number;
  status: string;
  vendor_signed_at: string | null;
  client_signed_at: string | null;
  stripe_pdf_url: string | null;
  stripe_hosted_invoice_url: string | null;
  created_at: string;
  vendor_id: string;
  client_id: string;
}

interface InvoiceListProps {
  userRole: 'vendor' | 'client';
  userId: string;
}

export function InvoiceList({ userRole, userId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureModal, setSignatureModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [signature, setSignature] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [userId, userRole]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole === 'vendor') {
        query.eq('vendor_id', userId);
      } else {
        query.eq('client_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      draft: { variant: "outline", label: "Draft" },
      sent: { variant: "default", label: "Sent" },
      paid: { variant: "secondary", label: "Paid" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSignInvoice = async (invoice: Invoice) => {
    if (userRole === 'vendor') {
      // Fetch vendor business name
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('business_name')
        .eq('user_id', userId)
        .single();

      setSignature(vendorProfile?.business_name || '');
    }
    setSelectedInvoice(invoice);
    setSignatureModal(true);
  };

  const processSignature = async () => {
    if (!selectedInvoice || !signature.trim()) {
      toast({
        title: "Error",
        description: "Please enter your signature",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      if (userRole === 'vendor') {
        // Vendor signing - update invoice and create Stripe invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            vendor_signed_at: new Date().toISOString(),
            vendor_signature_url: signature,
          })
          .eq('id', selectedInvoice.id);

        if (updateError) throw updateError;

        // Get vendor's Stripe Connect ID
        const { data: vendorProfile } = await supabase
          .from('vendor_profiles')
          .select('stripe_connect_id')
          .eq('user_id', userId)
          .single();

        if (!vendorProfile?.stripe_connect_id) {
          toast({
            title: "Stripe Setup Required",
            description: "Please complete Stripe Connect onboarding first",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Create Stripe invoice
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          'stripe-create-invoice',
          {
            body: {
              invoiceId: selectedInvoice.id,
              stripeConnectAccountId: vendorProfile.stripe_connect_id,
            },
          }
        );

        if (stripeError) throw stripeError;

        // Send email to client
        await supabase.functions.invoke('send-invoice-email', {
          body: { invoiceId: selectedInvoice.id },
        });

        toast({
          title: "Success",
          description: "Invoice signed and sent to client",
        });
      } else {
        // Client signing (acknowledgment only)
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            client_signed_at: new Date().toISOString(),
            client_signature_url: signature,
          })
          .eq('id', selectedInvoice.id);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Invoice acknowledged",
        });
      }

      setSignatureModal(false);
      setSignature("");
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNow = async (invoice: Invoice) => {
    try {
      // If we already have the hosted URL, use it
      if (invoice.stripe_hosted_invoice_url) {
        window.open(invoice.stripe_hosted_invoice_url, '_blank');
        toast({
          title: "Opening payment page",
          description: "You will be redirected to Stripe to complete your payment",
        });
        return;
      }

      // Otherwise fetch it from the database
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('stripe_hosted_invoice_url')
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      if (invoiceData?.stripe_hosted_invoice_url) {
        window.open(invoiceData.stripe_hosted_invoice_url, '_blank');
        toast({
          title: "Opening payment page",
          description: "You will be redirected to Stripe to complete your payment",
        });
      } else {
        toast({
          title: "Error",
          description: "Payment URL not available. Please contact the vendor.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Failed to open payment page. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {userRole === 'vendor' 
              ? 'Manage your invoices and track payments' 
              : 'View and pay your invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {invoice.legal_invoice_number || invoice.invoice_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">
                        €{Number(invoice.subtotal_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">VAT</p>
                      <p className="font-medium">
                        €{Number(invoice.vat_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-lg">
                        €{Number(invoice.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Download PDF Button */}
                    {invoice.stripe_pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invoice.stripe_pdf_url!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}

                    {/* Vendor Actions */}
                    {userRole === 'vendor' && (
                      <>
                        {!invoice.vendor_signed_at && invoice.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSignInvoice(invoice)}
                            disabled={processing}
                          >
                            Sign & Send Invoice
                          </Button>
                        )}
                        {invoice.vendor_signed_at && (
                          <Badge variant="secondary">
                            Signed on {new Date(invoice.vendor_signed_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </>
                    )}

                    {/* Client Actions */}
                    {userRole === 'client' && (
                      <>
                        {invoice.status === 'sent' && (
                          <Button
                            size="sm"
                            onClick={() => handlePayNow(invoice)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
                          <Badge variant="secondary">
                            Paid
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Modal */}
      <Dialog open={signatureModal} onOpenChange={setSignatureModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userRole === 'vendor' ? 'Sign Invoice' : 'Acknowledge Invoice'}
            </DialogTitle>
            <DialogDescription>
              {userRole === 'vendor'
                ? 'Sign this invoice to create the Stripe invoice and send it to the client'
                : 'Acknowledge receipt of this invoice'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signature">
                {userRole === 'vendor' ? 'Business Name' : 'Your Name'}
              </Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={userRole === 'vendor' ? 'Enter your business name' : 'Enter your name'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignatureModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={processSignature} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {userRole === 'vendor' ? 'Sign & Send' : 'Acknowledge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InvoiceList;
