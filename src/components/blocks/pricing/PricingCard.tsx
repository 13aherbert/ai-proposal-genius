import NumberFlow from "@number-flow/react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  plan: {
    name: string;
    description: string;
    price: {
      monthly: number;
      annual: number;
    };
    features: string[];
    highlight?: boolean;
    cta?: string;
  };
  isMonthly: boolean;
  index: number;
  isDesktop: boolean;
}

export function PricingCard({ plan, isMonthly, index, isDesktop }: PricingCardProps) {
  const price = isMonthly ? plan.price.monthly : plan.price.annual;
  const period = isMonthly ? "/month" : "/year";

  return (
    <div
      className={`relative p-6 rounded-lg ${
        plan.highlight
          ? "bg-brand-green text-white"
          : "bg-black/30 backdrop-blur-sm text-white"
      }`}
    >
      {plan.highlight && isDesktop && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-white text-brand-green px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm opacity-80">{plan.description}</p>

        <div className="flex items-baseline gap-1">
          <NumberFlow
            value={price}
            options={{
              style: "currency",
              currency: "USD"
            }}
            className="text-3xl font-bold"
          />
          <span className="text-sm opacity-80">{period}</span>
        </div>

        <Button
          className={`w-full ${
            plan.highlight
              ? "bg-white text-brand-green hover:bg-gray-100"
              : "bg-brand-green text-white hover:bg-brand-green/90"
          }`}
        >
          {plan.cta || "Get Started"}
        </Button>

        <ul className="space-y-3 pt-4">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start gap-2">
              <Check className="h-5 w-5 shrink-0 opacity-80" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}