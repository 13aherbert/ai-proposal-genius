import { useMediaQuery } from "@/hooks/use-media-query";
import { PricingCard } from "./PricingCard";

interface PricingGridProps {
  plans: Array<{
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
  }>;
}

export function PricingGrid({ plans }: PricingGridProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
      {plans.map((plan, index) => (
        <PricingCard
          key={index}
          plan={plan}
          index={index}
          isDesktop={isDesktop}
        />
      ))}
    </div>
  );
}