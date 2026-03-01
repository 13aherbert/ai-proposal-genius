
import { Pricing } from "./pricing";

const plans = [
  {
    name: "Starter",
    price: "0",
    yearlyPrice: "0",
    period: "Forever",
    features: [
      "Up to 3 projects",
      "AI RFP Summary",
      "AI Proposal Outline",
      "Basic AI Proposal Draft",
      "Community support",
    ],
    description: "Perfect for getting started - no credit card required",
    buttonText: "Get Started Free",
    href: "/#signup",
    isPopular: false,
    priceId: {
      monthly: "",
      annual: ""
    }
  },
  {
    name: "Basic",
    price: "49",
    yearlyPrice: "470",
    period: "month",
    features: [
      "Up to 10 projects",
      "Enhanced AI RFP Summary",
      "Advanced AI Proposal Outline",
      "Enhanced AI Proposal Draft",
      "24-hour support response time",
      "Email support",
    ],
    description: "Perfect for small teams and growing businesses",
    buttonText: "Upgrade to Basic",
    href: "/subscription",
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
      "Priority support",
      "Team collaboration",
    ],
    description: "Best for large teams and enterprises",
    buttonText: "Upgrade to Pro",
    href: "/subscription",
    isPopular: false,
    priceId: {
      monthly: "prod_Rn5STkpd7teaIR",
      annual: "prod_Rn5STkpd7teaIR"
    }
  },
  {
    name: "Enterprise",
    price: "299",
    yearlyPrice: "2870",
    period: "month",
    features: [
      "Unlimited projects",
      "Unlimited users",
      "API access",
      "SSO integration",
      "Dedicated account manager",
      "Custom branding",
      "Priority onboarding",
    ],
    description: "For organizations needing full control and dedicated support",
    buttonText: "Contact Sales",
    href: "mailto:sales@optirfp.ai",
    isPopular: false,
    priceId: {
      monthly: "",
      annual: ""
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
