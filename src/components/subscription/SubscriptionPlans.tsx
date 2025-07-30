
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

export function SubscriptionPlans() {
  const subscription = useSubscription();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [creatingFreeSubscription, setCreatingFreeSubscription] = useState(false);

  const handleContinueFree = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    setCreatingFreeSubscription(true);
    try {
      await createDefaultSubscription(
        session.user.id,
        subscription.setSubscription,
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
          <Label htmlFor="billing-interval">Annual (Save ~20%)</Label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Starter Plan */}
        <Card className="relative">
          <CardHeader>
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
            <ul className="space-y-2">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.starter} projects</li>
              <li>✓ AI RFP Summary</li>
              <li>✓ AI Proposal Outline</li>
              <li>✓ Basic AI Proposal Draft</li>
              <li>✓ Community support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleContinueFree}
              disabled={creatingFreeSubscription}
            >
              {creatingFreeSubscription ? "Setting up..." : "Continue Free"}
            </Button>
          </CardFooter>
        </Card>

        {/* Basic Plan (formerly Starter) */}
        <Card>
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>For small teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${billingInterval === 'monthly' ? '49' : '470'}/{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </div>
            <ul className="space-y-2">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.basic} projects</li>
              <li>✓ Enhanced AI RFP Summary</li>
              <li>✓ Advanced AI Proposal Outline</li>
              <li>✓ Enhanced AI Proposal Draft</li>
              <li>✓ 24-hour support response time</li>
              <li>✓ Email support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradeButton 
              currentPlan={subscription.subscription ? toSubscriptionPlan(subscription.subscription) : null} 
              targetPlan="basic" 
              variant={billingInterval} 
            />
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary relative">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Pro</CardTitle>
              <Badge>Most Popular</Badge>
            </div>
            <CardDescription>For growing businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${billingInterval === 'monthly' ? '99' : '950'}/{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </div>
            <ul className="space-y-2">
              <li>✓ Up to {SUBSCRIPTION_PLAN_LIMITS.pro} projects</li>
              <li>✓ Advanced AI RFP Summary</li>
              <li>✓ Enhanced AI Proposal Outline</li>
              <li>✓ Advanced AI Proposal Draft</li>
              <li>✓ Compiled Draft Preview</li>
              <li>✓ AI Proposal Evaluation</li>
              <li>✓ Priority support</li>
              <li>✓ Team collaboration</li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradeButton 
              currentPlan={subscription.subscription ? toSubscriptionPlan(subscription.subscription) : null} 
              targetPlan="pro" 
              variant={billingInterval} 
            />
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="border-gradient-to-r from-purple-500 to-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 opacity-50"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <CardTitle>Enterprise</CardTitle>
              <Badge variant="outline" className="border-purple-500 text-purple-700">Custom</Badge>
            </div>
            <CardDescription>For large organizations</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-4">
              Custom Pricing
            </div>
            <ul className="space-y-2">
              <li>✓ Unlimited projects</li>
              <li>✓ White-label branding</li>
              <li>✓ Custom domain</li>
              <li>✓ Advanced analytics</li>
              <li>✓ SSO integration</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
              <li>✓ Custom integrations</li>
              <li>✓ Dedicated account manager</li>
            </ul>
          </CardContent>
          <CardFooter className="relative">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
              onClick={() => {
                toast.success("Enterprise inquiry sent! Our team will contact you within 24 hours.");
              }}
            >
              Contact Sales
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
}
