
import { Pricing } from "./pricing";

const plans = [
  {
    name: "Free Trial",
    price: "0",
    yearlyPrice: "0",
    period: "Forever",
    features: [
      "Process up to 3 Projects",
      "AI RFP Summary",
      "AI Proposal Outline",
      "Basic AI Proposal Draft",
      "Email support",
    ],
    description: "Perfect for getting started - no credit card required",
    buttonText: "Continue with Free",
    href: "/dashboard",
    isPopular: false,
    priceId: {
      monthly: "",
      annual: ""
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
    isPopular: true,
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
      "Priority support response time",
      "Email support",
    ],
    description: "Best for growing businesses",
    buttonText: "Get Started",
    href: "/signup",
    isPopular: false,
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
      title="Choose Your Plan"
      description="Start free and upgrade when you're ready for more features"
    />
  );
}
