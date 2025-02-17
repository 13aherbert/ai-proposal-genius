
import { Pricing } from "./pricing";

const plans = [
  {
    name: "Trial",
    price: "0",
    yearlyPrice: "0",
    period: "Next 3 months",
    features: [
      "Process up to 3 Projects",
      "AI RFP Summary",
      "AI Proposal Outline",
      "AI Proposal Draft",
    ],
    description: "No credit card required",
    buttonText: "Start Free Trial",
    href: "/signup",
    isPopular: false,
    priceId: {
      monthly: "price_trial",
      annual: "price_trial"
    }
  },
  {
    name: "Starter",
    price: "49",
    yearlyPrice: "499",
    period: "month",
    features: [
      "Up to 10 projects",
      "Advanced AI RFP Summary",
      "Enhanced AI Proposal Outline",
      "Basic AI Proposal Draft",
      "24-hour support response time",
      "Email support",
    ],
    description: "Perfect for small teams",
    buttonText: "Get Started",
    href: "/signup",
    isPopular: false,
    priceId: {
      monthly: "price_starter_monthly",
      annual: "price_starter_annual"
    }
  },
  {
    name: "Pro",
    price: "99",
    yearlyPrice: "950",
    period: "month",
    features: [
      "Up to 30 projects",
      "Advanced AI RFP Summary",
      "Enhanced AI Proposal Outline",
      "Advanced AI Proposal Draft",
      "Compiled Draft Preview",
      "AI Proposal Evaluation",
      "24-hour support response time",
      "Email support",
    ],
    description: "Best for growing businesses",
    buttonText: "Get Started",
    href: "/signup",
    isPopular: true,
    priceId: {
      monthly: "price_pro_monthly",
      annual: "price_pro_annual"
    }
  },
];

export function PricingDemo() {
  return (
    <Pricing
      plans={plans}
      title="Simple, Transparent Pricing"
      description="Choose the plan that works for you"
    />
  );
}
