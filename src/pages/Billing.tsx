import React from 'react';
import { CreditCard } from 'lucide-react';
import { SubscriptionCard } from '@/components/account/SubscriptionCard';
import { SubscriptionManager } from '@/components/organization/SubscriptionManager';
import { BillingHistory } from '@/components/account/BillingHistory';
import { useSEO } from '@/hooks/use-seo';

export default function Billing() {
  useSEO({
    noindex: true, title: "Billing & Subscription — OptiRFP", description: "Manage your OptiRFP plan, payment methods, and invoices." });
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan, payment methods, and invoices.
        </p>
      </div>

      <SubscriptionCard />
      <SubscriptionManager />
      <BillingHistory />
    </div>
  );
}
