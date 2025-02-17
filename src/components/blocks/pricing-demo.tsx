
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
      monthly: "prod_Rn5PqfqaiB7u3T",
      annual: "prod_Rn5PqfqaiB7u3T"
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
      monthly: "prod_Rn5Qc3JRlG2dP5",
      annual: "prod_Rn5Qc3JRlG2dP5"
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
      monthly: "prod_Rn5STkpd7teaIR",
      annual: "prod_Rn5STkpd7teaIR"
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
