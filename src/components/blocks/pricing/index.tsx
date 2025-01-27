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
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
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