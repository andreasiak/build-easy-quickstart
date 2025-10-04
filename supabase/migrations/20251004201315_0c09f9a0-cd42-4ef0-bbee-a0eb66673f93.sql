-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Clients can create invoices" ON public.invoices;

-- Create new INSERT policy allowing both vendors and clients to create invoices
CREATE POLICY "Vendors and clients can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  auth.uid() = vendor_id OR auth.uid() = client_id
);