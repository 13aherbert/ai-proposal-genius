import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import { PricingHeader } from "./PricingHeader";
import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";
import type { PricingProps } from "./types";

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="container py-20">
      <PricingHeader title={title} description={description} />
      <BillingToggle isMonthly={isMonthly} onToggle={(checked) => setIsMonthly(!checked)} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {plans.map((plan, index) => (
          <PricingCard
            key={index}
            plan={plan}
            isMonthly={isMonthly}
            index={index}
            isDesktop={isDesktop}
          />
        ))}
      </div>
    </div>
  );
}