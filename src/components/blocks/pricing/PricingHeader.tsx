interface PricingHeaderProps {
  title: string;
  description: string;
}

export function PricingHeader({ title, description }: PricingHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-12">
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      <p className="text-muted-foreground text-lg whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}