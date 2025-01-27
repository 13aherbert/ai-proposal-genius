export interface PricingProps {
  plans: {
    name: string;
    description: string;
    price: {
      monthly: number;
      annual: number;
    };
    features: string[];
    highlight?: boolean;
    cta?: string;
  }[];
  title?: string;
  description?: string;
}