-- Add Stripe Connect columns to vendor_profiles
ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_onboarding_started_at timestamptz,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at timestamptz;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_stripe_connect_id 
ON vendor_profiles(stripe_connect_id) 
WHERE stripe_connect_id IS NOT NULL;