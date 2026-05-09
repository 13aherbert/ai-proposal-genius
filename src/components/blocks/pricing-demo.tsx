import { Pricing } from "./pricing";
import { ROICalculator } from "./ROICalculator";
import { CompetitorComparison } from "./CompetitorComparison";
import { PricingFAQ } from "./PricingFAQ";
import { STRIPE_PRICE_IDS } from "@/config/stripe-prices";

const plans = [
  {
    name: "Starter",
    price: "0",
    yearlyPrice: "0",
    period: "Forever",
    features: [
      "6 projects per year",
      "1 user",
      "Basic AI RFP Summary",
      "AI Proposal Outline",
      "Standard AI Draft (watermarked)",
      "Community support",
    ],
    description: "Perfect for getting started — no credit card required",
    subtitle: "Free forever",
    microcopy: "No credit card required",
    buttonText: "Get Started Free",
    href: "/auth?mode=signup",
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
      "36 projects per year (6× more)",
      "Unlimited team members",
      "Enhanced AI analysis",
      "Opportunity Search (10/mo)",
      "No watermarks",
      "Email support (24hr)",
      "Google Drive, SharePoint, Dropbox",
    ],
    description: "Best for small teams ready to scale",
    subtitle: "",
    microcopy: "",
    comparison: "4× cheaper than AutoRFP.ai",
    buttonText: "Start 14-Day Trial",
    href: "/subscription",
    isPopular: false,
    badge: "Best for small teams",
    priceId: {
      monthly: STRIPE_PRICE_IDS.growth.monthly,
      annual: STRIPE_PRICE_IDS.growth.annual,
    },
  },
  {
    name: "Business",
    price: "499",
    yearlyPrice: "5388",
    period: "month",
    features: [
      "120 projects per year (20× more)",
      "Unlimited team members",
      "Advanced AI with compliance checking",
      "Unlimited Opportunity Search",
      "AI Proposal Evaluation",
      "API access (5,000 calls/mo)",
      "Priority support (4hr)",
      "Salesforce, HubSpot, Slack, Teams",
      "Custom AI training (1/year)",
    ],
    description: "For growing teams that need more power",
    subtitle: "",
    microcopy: "",
    comparison: "10× cheaper than Loopio",
    buttonText: "Start 14-Day Trial",
    href: "/subscription",
    isPopular: true,
    badge: "Most Popular",
    priceId: {
      monthly: STRIPE_PRICE_IDS.business.monthly,
      annual: STRIPE_PRICE_IDS.business.annual,
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
      "Unlimited API calls",
      "SOC 2 Type II & FedRAMP",
      "Dedicated Customer Success Manager",
      "SSO/SAML (Okta, Azure AD, Google)",
      "On-premise deployment option",
      "Custom integrations",
      "Custom SLAs",
    ],
    description: "Custom solutions for organizations with 50+ users",
    subtitle: "Starting at $1,499/month",
    microcopy: "",
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
      <PricingFAQ />
    </>
  );
}
