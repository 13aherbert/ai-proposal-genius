import { Pricing } from "./pricing";
import { ROICalculator } from "./ROICalculator";
import { CompetitorComparison } from "./CompetitorComparison";

const plans = [
  {
    name: "Starter",
    price: "0",
    yearlyPrice: "0",
    period: "Forever",
    features: [
      "Up to 12 projects",
      "1 user",
      "AI RFP Summary",
      "AI Proposal Outline",
      "Basic AI Proposal Draft",
      "Community support",
    ],
    description: "Perfect for getting started — no credit card required",
    buttonText: "Start Free",
    href: "/#signup",
    isPopular: false,
    badge: "",
    priceId: {
      monthly: "",
      annual: "",
    },
  },
  {
    name: "Growth",
    price: "199",
    yearlyPrice: "2148",
    period: "month",
    features: [
      "Up to 36 projects",
      "Unlimited team members",
      "Enhanced AI RFP Summary",
      "Advanced AI Proposal Outline",
      "Enhanced AI Proposal Draft",
      "Email support",
    ],
    description: "Best for small teams ready to scale",
    buttonText: "Start Free Trial",
    href: "/subscription",
    isPopular: false,
    badge: "Best for small teams",
    priceId: {
      monthly: "prod_Rn5Qc3JRlG2dP5",
      annual: "prod_Rn5Qc3JRlG2dP5",
    },
  },
  {
    name: "Business",
    price: "499",
    yearlyPrice: "5388",
    period: "month",
    features: [
      "Up to 120 projects",
      "Unlimited team members",
      "Advanced AI RFP Summary",
      "Advanced AI Proposal Draft",
      "Compiled Draft Preview",
      "AI Proposal Evaluation",
      "API access",
      "Priority support",
    ],
    description: "For growing teams that need more power",
    buttonText: "Start Free Trial",
    href: "/subscription",
    isPopular: true,
    badge: "Most Popular",
    priceId: {
      monthly: "prod_Rn5STkpd7teaIR",
      annual: "prod_Rn5STkpd7teaIR",
    },
  },
  {
    name: "Enterprise",
    price: "1499",
    yearlyPrice: "17988",
    period: "month",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "SOC 2 Type II & FedRAMP compliance",
      "Dedicated Customer Success Manager",
      "4-hour SLA support",
      "Custom AI model training",
      "API access & webhooks",
      "SSO/SAML (Okta, Azure AD, Google)",
      "On-premise deployment option",
      "Custom integrations",
    ],
    description: "Custom solutions for organizations with 50+ users",
    buttonText: "Contact Sales",
    href: "#",
    isPopular: false,
    badge: "",
    priceId: {
      monthly: "",
      annual: "",
    },
  },
];

export function PricingDemo() {
  return (
    <>
      <ROICalculator />
      <Pricing
        plans={plans}
        title="Unlimited Team Members on All Paid Plans"
        description="Pay for RFPs, not seats. Add your entire team for one flat price."
      />
      <CompetitorComparison />
    </>
  );
}
