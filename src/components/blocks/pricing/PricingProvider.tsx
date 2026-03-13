import { ReactNode, useState } from 'react';
import { PricingContext } from './PricingContext';

interface PricingProviderProps {
  children: ReactNode;
}

export function PricingProvider({ children }: PricingProviderProps) {
  const [isMonthly, setIsMonthly] = useState(false); // Default to annual (higher LTV)

  return (
    <PricingContext.Provider value={{ isMonthly, setIsMonthly }}>
      {children}
    </PricingContext.Provider>
  );
}