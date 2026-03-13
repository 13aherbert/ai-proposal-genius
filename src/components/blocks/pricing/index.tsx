import { PricingProvider } from "./PricingProvider";
import { PricingHeader } from "./PricingHeader";
import { BillingToggle } from "./BillingToggle";
import { PricingGrid } from "./PricingGrid";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  badge?: string;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Unlimited Team Members on All Paid Plans",
  description = "Pay for RFPs, not seats. Add your entire team for one flat price.",
}: PricingProps) {
  return (
    <PricingProvider>
      <div className="container py-20">
        <PricingHeader title={title} description={description} />
        <BillingToggle />
        <PricingGrid plans={plans} />
      </div>
    </PricingProvider>
  );
}
