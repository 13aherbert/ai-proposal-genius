import { Pricing } from "./pricing";

const demoPlans = [
  {
    name: "14-DAY TRIAL",
    price: "0",
    yearlyPrice: "0",
    period: "Next 3 months",
    features: [
      "Process up to 3 Projects",
      "AI RFP Summary",
      "AI Proposal Outline", 
      "AI Proposal Draft",
    ],
    description: "Perfect for trying out our platform",
    buttonText: "Start Free Trial",
    href: "/subscription",
    isPopular: false,
  },
  {
    name: "STARTER",
    price: "49",
    yearlyPrice: "470",
    period: "month",
    features: [
      "Up to 10 projects",
      "Advanced RFP Summary",
      "Enhanced Proposal Outline",
      "Basic Proposal Draft",
      "24-hour support response time",
      "Email support",
    ],
    description: "Ideal for small teams and individual consultants",
    buttonText: "Get Started",
    href: "/subscription",
    isPopular: true,
  },
  {
    name: "PRO",
    price: "99",
    yearlyPrice: "950",
    period: "month",
    features: [
      "Unlimited projects",
      "Advanced RFP Summary",
      "Enhanced Proposal Outline",
      "Advanced Proposal Draft",
      "Compiled Draft Preview",
      "Proposal Evaluation",
      "Priority support",
      "1-hour support response time",
    ],
    description: "For growing businesses with advanced needs",
    buttonText: "Upgrade to Pro",
    href: "/subscription",
    isPopular: false,
  },
];

export function PricingDemo() {
  return (
    <div className="h-full w-full">
      <Pricing 
        plans={demoPlans}
        title="Simple, Transparent Pricing"
        description="Choose the plan that works for you
All plans include access to our platform and dedicated support."
      />
    </div>
  );
}
