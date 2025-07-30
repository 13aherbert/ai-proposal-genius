import React, { createContext, useContext, ReactNode } from 'react';
import { useBranding, BrandingConfig } from '@/hooks/useBranding';

interface BrandingContextType {
  branding: BrandingConfig | null;
  loading: boolean;
  error: string | null;
  updateBranding: (updates: Partial<BrandingConfig>) => Promise<any>;
  refetch: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const brandingData = useBranding();

  return (
    <BrandingContext.Provider value={brandingData}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBrandingContext() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  return context;
}