import { Pricing } from "./pricing";
import { ROICalculator } from "./ROICalculator";

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
      "Priority support",
      "Team collaboration",
    ],
    description: "Best for large teams and enterprises",
    buttonText: "Upgrade to Pro",
    href: "/subscription",
    isPopular: true,
    priceId: {
      monthly: "prod_Rn5STkpd7teaIR",
      annual: "prod_Rn5STkpd7teaIR"
    }
  },
  {
    name: "Enterprise",
    price: "499",
    yearlyPrice: "5388",
    period: "month",
    features: [
      "Unlimited everything (projects, users, storage)",
      "SOC 2 Type II & FedRAMP compliance",
      "Dedicated Customer Success Manager",
      "4-hour SLA support",
      "Custom AI model training",
      "API access & webhooks",
      "SSO/SAML (Okta, Azure AD, Google)",
      "On-premise deployment option",
      "Custom integrations",
      "Quarterly business reviews",
      "Team training sessions",
    ],
    description: "Custom solutions for organizations with 50+ users",
    buttonText: "Schedule Demo",
    href: "#",
    isPopular: false,
    priceId: {
      monthly: "",
      annual: ""
    }
  },
];

export function PricingDemo() {
  return (
    <>
    <ROICalculator />
    <Pricing
      plans={plans}
      title="Choose Your Plan"
      description="Start free and upgrade when you're ready for more features"
    />
    </>
  );
}
