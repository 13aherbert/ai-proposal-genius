import { SubscriptionManager } from "@/components/organization/SubscriptionManager";
import { BillingHistory } from "@/components/account/BillingHistory";

export default function AdminBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your plan, payment methods, and invoices.</p>
      </div>
      <SubscriptionManager />
      <BillingHistory />
    </div>
  );
}
