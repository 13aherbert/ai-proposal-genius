
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "./UpgradeButton";
import { useSubscription } from "@/hooks/subscription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_PLAN_LIMITS, toSubscriptionPlan } from "@/types/subscription";
import { createDefaultSubscription } from "@/hooks/subscription/utils/subscription-creation";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { CurrentPlanBadge } from "./CurrentPlanBadge";
import { UsageStats } from "./UsageStats";
import { format } from "date-fns";

export function SubscriptionPlans() {
  const { subscription: subContext, setSubscription } = useSubscription();
  const subscription = subContext ? toSubscriptionPlan(subContext) : null;
  const { session } = useAuth();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [creatingFreeSubscription, setCreatingFreeSubscription] = useState(false);

  const currentPlanType = subscription?.plan_type || 'starter';
  const isCurrentPlan = (planType: string) => currentPlanType === planType && subscription?.status === 'active';
  const renewalDate = subscription?.current_period_end 
    ? format(new Date(subscription.current_period_end), 'MMM d, yyyy')
    : null;

  const handleContinueFree = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    setCreatingFreeSubscription(true);
    try {
      await createDefaultSubscription(
        session.user.id,
        setSubscription,
        () => {
          toast.success("Welcome! Your free account is ready.");
          navigate('/dashboard');
        }
      );
    } catch (error) {
      console.error('Error creating free subscription:', error);
      toast.error("Failed to set up free account. Please try again.");
    } finally {
      setCreatingFreeSubscription(false);
    }
  };
  
  return <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-6">Start free and upgrade when you're ready for more features</p>
        <div className="flex items-center justify-center space-x-2">
          <Label htmlFor="billing-interval">Monthly</Label>
          <Switch id="billing-interval" checked={billingInterval === 'annual'} onCheckedChange={checked => setBillingInterval(checked ? 'annual' : 'monthly')} />
          <Label htmlFor="billing-interval">Annual (Save 10%)</Label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Free Starter Plan */}
        <Card className={`relative ${isCurrentPlan('starter') ? 'ring-2 ring-green-500' : ''}`}>
          <CurrentPlanBadge isCurrentPlan={isCurrentPlan('starter')} />
          <CardHeader className={isCurrentPlan('starter') ? 'pt-8' : ''}>
            <div className="flex items-center gap-2">
              <CardTitle>Starter</CardTitle>
              <Badge variant="secondary">Free</Badge>
            </div>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              $0<span className="text-lg font-normal">/forever</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.starter} projects</li>
              <li>✓ 1 user</li>
              <li>✓ AI RFP Summary (Basic)</li>
              <li>✓ AI Proposal Outline</li>
              <li>✓ AI Draft (Watermarked)</li>
              <li>✓ Community support</li>
            </ul>
            {isCurrentPlan('starter') && (
              <UsageStats projectLimit={SUBSCRIPTION_PLAN_LIMITS.starter} planType="starter" />
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={isCurrentPlan('starter') ? "secondary" : "outline"}
              onClick={handleContinueFree}
              disabled={creatingFreeSubscription || isCurrentPlan('starter')}
            >
              {isCurrentPlan('starter') ? "Current Plan" : creatingFreeSubscription ? "Setting up..." : "Continue Free"}
            </Button>
          </CardFooter>
        </Card>

        {/* Growth Plan */}
        <Card className={`relative ${isCurrentPlan('growth') ? 'ring-2 ring-green-500' : ''}`}>
          <CurrentPlanBadge isCurrentPlan={isCurrentPlan('growth')} renewalDate={renewalDate} />
          <CardHeader className={isCurrentPlan('growth') ? 'pt-8' : ''}>
            <CardTitle>Growth</CardTitle>
            <CardDescription>For growing teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              ${billingInterval === 'monthly' ? '199' : '179'}/mo
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {billingInterval === 'monthly' ? 'billed monthly' : 'billed annually at $2,148/yr'}
            </p>
            <ul className="space-y-2 mb-4 text-sm">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.growth} projects</li>
              <li>✓ Unlimited users</li>
              <li>✓ AI RFP Summary (Enhanced)</li>
              <li>✓ AI Draft (No Watermark)</li>
              <li>✓ Opportunity Search (10/mo)</li>
              <li>✓ Email support</li>
              <li>✓ Google Drive, SharePoint, Dropbox</li>
            </ul>
            {isCurrentPlan('growth') && (
              <>
                <UsageStats projectLimit={SUBSCRIPTION_PLAN_LIMITS.growth} planType="growth" />
                {renewalDate && (
                  <p className="text-xs text-muted-foreground mt-3">Renews on {renewalDate}</p>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <UpgradeButton currentPlan={subscription} targetPlan="growth" variant={billingInterval} />
          </CardFooter>
        </Card>

        {/* Business Plan */}
        <Card className={`relative ${isCurrentPlan('business') ? 'ring-2 ring-green-500' : 'border-primary'}`}>
          <CurrentPlanBadge isCurrentPlan={isCurrentPlan('business')} renewalDate={renewalDate} />
          <CardHeader className={isCurrentPlan('business') ? 'pt-8' : ''}>
            <div className="flex items-center gap-2">
              <CardTitle>Business</CardTitle>
              {!isCurrentPlan('business') && <Badge>Most Popular</Badge>}
            </div>
            <CardDescription>For professional teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              ${billingInterval === 'monthly' ? '499' : '449'}/mo
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {billingInterval === 'monthly' ? 'billed monthly' : 'billed annually at $5,388/yr'}
            </p>
            <ul className="space-y-2 mb-4 text-sm">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.business} projects</li>
              <li>✓ Unlimited users</li>
              <li>✓ AI RFP Summary (Advanced)</li>
              <li>✓ AI Evaluation</li>
              <li>✓ Opportunity Search (Unlimited)</li>
              <li>✓ API Access (5,000 calls/mo)</li>
              <li>✓ Priority support</li>
              <li>✓ Salesforce, HubSpot, Slack, Teams</li>
              <li>✓ 1 Custom AI Training/yr</li>
            </ul>
            {isCurrentPlan('business') && (
              <>
                <UsageStats projectLimit={SUBSCRIPTION_PLAN_LIMITS.business} planType="business" />
                {renewalDate && (
                  <p className="text-xs text-muted-foreground mt-3">Renews on {renewalDate}</p>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <UpgradeButton currentPlan={subscription} targetPlan="business" variant={billingInterval} />
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="border-gradient-to-r from-purple-500 to-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 opacity-50"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <CardTitle>Enterprise</CardTitle>
              <Badge variant="outline" className="border-purple-500 text-purple-700">Premium</Badge>
            </div>
            <CardDescription>Custom solutions for large organizations</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-1">
              $1,499+/mo
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Custom pricing available
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ Unlimited projects & users</li>
              <li>✓ SOC 2 & FedRAMP compliance</li>
              <li>✓ Dedicated Customer Success Manager</li>
              <li>✓ 4-hour SLA support</li>
              <li>✓ Custom AI configuration</li>
              <li>✓ Unlimited API access</li>
              <li>✓ SSO/SAML (Okta, Azure AD, Google)</li>
              <li>✓ All integrations + custom</li>
              <li>✓ Unlimited Custom AI Training</li>
            </ul>
          </CardContent>
          <CardFooter className="relative">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
              onClick={() => {
                toast.success("Demo request sent! Our team will contact you within 24 hours.");
              }}
            >
              Schedule Demo
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
}
