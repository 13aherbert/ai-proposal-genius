
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "./UpgradeButton";
import { useSubscription } from "@/hooks/use-subscription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SubscriptionPlans() {
  const { data: subscription } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Subscription Plans</h2>
        <div className="flex items-center justify-center space-x-2">
          <Label htmlFor="billing-interval">Monthly</Label>
          <Switch
            id="billing-interval"
            checked={billingInterval === 'annual'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'annual' : 'monthly')}
          />
          <Label htmlFor="billing-interval">Annual (Save 20%)</Label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Trial</CardTitle>
            <CardDescription>14-day free trial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0</div>
            <ul className="space-y-2">
              <li>✓ Basic features</li>
              <li>✓ 14-day access</li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradeButton
              currentPlan={subscription?.plan}
              targetPlan="trial"
            />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>For small teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${billingInterval === 'monthly' ? '49' : '499'}/{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </div>
            <ul className="space-y-2">
              <li>✓ All Trial features</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradeButton
              currentPlan={subscription?.plan}
              targetPlan="starter"
              variant={billingInterval}
            />
          </CardFooter>
        </Card>

        <Card className="border-brand-green">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For growing businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${billingInterval === 'monthly' ? '99' : '950'}/{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </div>
            <ul className="space-y-2">
              <li>✓ All Starter features</li>
              <li>✓ Custom integrations</li>
              <li>✓ Dedicated support</li>
              <li>✓ Advanced security</li>
            </ul>
          </CardContent>
          <CardFooter>
            <UpgradeButton
              currentPlan={subscription?.plan}
              targetPlan="pro"
              variant={billingInterval}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
