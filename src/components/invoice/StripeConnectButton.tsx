import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface StripeConnectButtonProps {
  onComplete?: () => void;
}

const StripeConnectButton = ({ onComplete }: StripeConnectButtonProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);

  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const checkStripeStatus = async () => {
    if (!user) return;

    try {
      setChecking(true);
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const row: any = data || {};
      setStripeConnectId(row.stripe_connect_id || null);
      setOnboardingComplete(!!row.stripe_onboarding_complete);
      setChargesEnabled(!!row.stripe_charges_enabled);
      setPayoutsEnabled(!!row.stripe_payouts_enabled);

      // If account exists but status unknown, check with Stripe
      if (row.stripe_connect_id && !row.stripe_onboarding_complete) {
        await updateStripeStatus(row.stripe_connect_id);
      }
    } catch (error: any) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setChecking(false);
    }
  };

  const updateStripeStatus = async (accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: {
          action: 'check-status',
          accountId
        }
      });

      if (error) throw error;

      if (data) {
        setOnboardingComplete(data.detailsSubmitted);
        setChargesEnabled(data.chargesEnabled);
        setPayoutsEnabled(data.payoutsEnabled);
        
        if (data.detailsSubmitted && onComplete) {
          onComplete();
        }
      }
    } catch (error: any) {
      console.error('Error updating Stripe status:', error);
    }
  };

  const handleEnablePayments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const refreshUrl = `${baseUrl}/business-information?stripe_refresh=true`;
      const returnUrl = `${baseUrl}/business-information?stripe_complete=true`;

      const action = stripeConnectId ? 'refresh' : 'create';

      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: {
          action,
          accountId: stripeConnectId,
          refreshUrl,
          returnUrl
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      }

      if (data?.accountId && !stripeConnectId) {
        setStripeConnectId(data.accountId);
      }

    } catch (error: any) {
      console.error('Error enabling payments:', error);
      const message = (error?.message as string) || (typeof error === 'string' ? error : '') || 'Failed to start Stripe onboarding';
      const friendly = message.includes('signed up for Connect')
        ? 'Stripe Connect is not enabled for this Stripe account. Enable Connect in your Stripe Dashboard (Test mode is fine), then retry.'
        : message;
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessDashboard = async () => {
    if (!stripeConnectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: {
          action: 'create-login-link',
          accountId: stripeConnectId
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error accessing dashboard:', error);
      toast.error('Failed to access Stripe dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (onboardingComplete && chargesEnabled) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Stripe Connect Enabled</CardTitle>
          </div>
          <CardDescription>
            Your payment account is active and ready to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Charges Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              {payoutsEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm">
                Payouts {payoutsEnabled ? 'Enabled' : 'Pending'}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleAccessDashboard}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Access Stripe Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stripeConnectId && !onboardingComplete) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900">Complete Stripe Setup</CardTitle>
          </div>
          <CardDescription>
            Your Stripe account needs additional information to start accepting payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Please complete the Stripe onboarding process to enable invoice payments.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleEnablePayments}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Continue Stripe Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enable Payment Collection</CardTitle>
        <CardDescription>
          Connect your Stripe account to send invoices and receive payments from clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What you'll need:</strong>
            <ul className="list-disc ml-4 mt-2 text-sm space-y-1">
              <li>Business information (name, address, VAT ID)</li>
              <li>Bank account details for payouts</li>
              <li>Business owner identification</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-sm">Benefits:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✓ Send professional invoices with Cyprus VAT</li>
            <li>✓ Accept card payments online</li>
            <li>✓ Automatic payment tracking</li>
            <li>✓ Secure payment processing</li>
          </ul>
        </div>

        <Button
          onClick={handleEnablePayments}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Connect Stripe Account
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Powered by <strong>Stripe Connect</strong> • Secure payment processing
        </p>
      </CardContent>
    </Card>
  );
};

export default StripeConnectButton;
