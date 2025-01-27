import { createContext, useContext } from 'react';

interface PricingContextType {
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
}

export const PricingContext = createContext<PricingContextType | undefined>(undefined);

export function usePricingContext() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricingContext must be used within a PricingProvider');
  }
  return context;
}