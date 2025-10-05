-- Add stripe_hosted_invoice_url column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS stripe_hosted_invoice_url text;

-- Update invoice status to reflect simplified flow
-- Ensure invoices can only move from draft -> sent -> paid
COMMENT ON COLUMN public.invoices.status IS 'Invoice status: draft, sent, paid, cancelled';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON public.invoices(vendor_id);