interface PricingHeaderProps {
  title: string;
  description: string;
}

export function PricingHeader({ title, description }: PricingHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-8">
      <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
      <p className="text-lg text-gray-300 whitespace-pre-line">{description}</p>
    </div>
  );
}