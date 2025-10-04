-- Update the trigger function to also set invoice_number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate legal invoice number if not set
  IF NEW.legal_invoice_number IS NULL THEN
    NEW.legal_invoice_number := generate_legal_invoice_number();
  END IF;
  
  -- Set invoice_number to the same as legal_invoice_number
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := NEW.legal_invoice_number;
  END IF;
  
  IF NEW.issued_at IS NULL THEN
    NEW.issued_at := NOW();
  END IF;
  
  IF NEW.tax_point IS NULL THEN
    NEW.tax_point := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;