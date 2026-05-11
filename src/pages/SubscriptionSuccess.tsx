
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Loader2, Mail, Calendar, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/subscription";
import { useAuth } from "@/components/AuthProvider";
import { format, addMonths } from "date-fns";
import confetti from "canvas-confetti";
import { useSEO } from "@/hooks/use-seo";

/**
 * SubscriptionSuccess - Post-checkout confirmation page
 * Shows purchase confirmation with plan details and next billing date
 */
export default function SubscriptionSuccess() {
  useSEO({ title: "Subscription Confirmed — OptiRFP", description: "Your OptiRFP subscription is active. Start drafting your next winning proposal." });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { subscription, refreshSubscription, isLoading } = useSubscription();
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const sessionId = searchParams.get('session_id');
  const isLifetime = searchParams.get('lifetime') === '1' || (subscription as any)?.is_lifetime === true;

  // Trigger confetti on successful load
  useEffect(() => {
    if (!hasTriggeredConfetti && subscription && subscription.status === 'active') {
      setHasTriggeredConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [subscription, hasTriggeredConfetti]);

  // Refresh subscription data when page loads with session_id
  useEffect(() => {
    if (sessionId) {
      // Give the webhook a moment to process
      const timer = setTimeout(() => {
        refreshSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, refreshSubscription]);

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'growth': return 'Growth Plan';
      case 'business': return 'Business Plan';
      case 'enterprise': return 'Enterprise Plan';
      case 'starter': return 'Starter Plan';
      // Legacy slugs
      case 'pro': return 'Business Plan';
      case 'basic': return 'Growth Plan';
      default: return 'Subscription';
    }
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'enterprise': return 'Custom';
      case 'business': return '$499/month';
      case 'growth': return '$199/month';
      default: return '';
    }
  };

  const getPlanFeatures = (planType: string): string[] => {
    switch (planType) {
      case 'enterprise':
        return [
          'Unlimited projects & users',
          'SSO/SAML authentication',
          'Dedicated CSM',
          'SOC 2/FedRAMP compliance',
          'Custom integrations'
        ];
      case 'business':
        return [
          '120 projects per year',
          'Advanced AI features & Proposal Evaluation',
          'API access & CRM integrations',
          'Priority support',
          'Unlimited users'
        ];
      case 'growth':
        return [
          '36 projects per year',
          'Enhanced AI features',
          '10/mo Opportunity Searches',
          'Email support',
          'Unlimited users'
        ];
      default:
        return [];
    }
  };

  const userEmail = session?.user?.email || 'your email';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
          <p className="text-muted-foreground">This will only take a moment.</p>
        </div>
      </div>
    );
  }

  const planType = subscription?.plan_type || 'pro';
  const nextBillingDate = subscription?.current_period_end 
    ? format(new Date(subscription.current_period_end), 'MMMM d, yyyy')
    : format(addMonths(new Date(), 1), 'MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">
            {isLifetime
              ? `You're a ${getPlanDisplayName(planType)} member — for life! 🎉`
              : `Welcome to ${getPlanDisplayName(planType)}!`}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isLifetime
              ? "Your one-time payment is processed. No recurring charges, ever."
              : "Your subscription is now active. You're all set to create amazing proposals."}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isLifetime ? "Purchase Details" : "Subscription Details"}
            </CardTitle>
            <CardDescription>Here's a summary of your purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">
                {getPlanDisplayName(planType)}{isLifetime ? " (Lifetime)" : ""}
              </span>
            </div>
            {!isLifetime && getPlanPrice(planType) && (
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{getPlanPrice(planType)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Active
              </span>
            </div>
            {!isLifetime && (
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next billing date
                </span>
                <span className="font-semibold">{nextBillingDate}</span>
              </div>
            )}
            {isLifetime && (
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-semibold">One-time — no renewals</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Features Unlocked</CardTitle>
            <CardDescription>You now have access to these premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getPlanFeatures(planType).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium mb-1">Receipt sent to your email</p>
                <p className="text-sm text-muted-foreground">
                  A receipt has been sent to <span className="font-medium">{userEmail}</span>. 
                  If you don't see it, please check your spam folder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/upload-rfp')}
          >
            Start a New Project
          </Button>
        </div>
      </div>
    </div>
  );
}
