import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface BrandingConfig {
  id?: string;
  organization_id: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  custom_css?: string;
  brand_name?: string;
  tagline?: string;
  support_email?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
}

interface BrandingContextValue {
  branding: BrandingConfig | null;
  loading: boolean;
  error: string | null;
  updateBranding: (config: Partial<BrandingConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const defaultBranding: Omit<BrandingConfig, 'organization_id'> = {
  primary_color: '#3b82f6',
  secondary_color: '#64748b',
  accent_color: '#06b6d4',
  background_color: '#ffffff',
  text_color: '#1e293b',
  font_family: 'Inter',
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useCurrentOrganization();

  const applyBrandingToCSS = (config: BrandingConfig) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS custom properties
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h! /= 6;
      }
      
      return `${Math.round(h! * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply colors
    root.style.setProperty('--primary', hexToHsl(config.primary_color));
    root.style.setProperty('--secondary', hexToHsl(config.secondary_color));
    root.style.setProperty('--accent', hexToHsl(config.accent_color));
    root.style.setProperty('--background', hexToHsl(config.background_color));
    root.style.setProperty('--foreground', hexToHsl(config.text_color));
    
    // Apply font family
    root.style.setProperty('font-family', config.font_family);
    
    // Apply custom CSS if provided (sanitized to prevent injection)
    if (config.custom_css) {
      const sanitizedCss = sanitizeCustomCss(config.custom_css);
      const customStyleElement = document.getElementById('custom-branding-styles') || document.createElement('style');
      customStyleElement.id = 'custom-branding-styles';
      customStyleElement.textContent = sanitizedCss;
      if (!document.getElementById('custom-branding-styles')) {
        document.head.appendChild(customStyleElement);
      }
    }
  };

  const loadBranding = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const brandingConfig = data || {
        organization_id: organization.id,
        ...defaultBranding,
      };

      setBranding(brandingConfig);
      applyBrandingToCSS(brandingConfig);
    } catch (err) {
      console.error('Failed to load branding:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branding');
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (updates: Partial<BrandingConfig>) => {
    if (!organization?.id) return;

    try {
      const updatedBranding = { ...branding, ...updates };
      
      const { data, error } = await supabase
        .from('organization_branding')
        .upsert({
          organization_id: organization.id,
          ...updatedBranding,
        })
        .select()
        .single();

      if (error) throw error;

      setBranding(data);
      applyBrandingToCSS(data);
    } catch (err) {
      console.error('Failed to update branding:', err);
      throw err;
    }
  };

  const resetToDefaults = async () => {
    if (!organization?.id) return;

    try {
      const defaultConfig = {
        organization_id: organization.id,
        ...defaultBranding,
      };

      const { data, error } = await supabase
        .from('organization_branding')
        .upsert(defaultConfig)
        .select()
        .single();

      if (error) throw error;

      setBranding(data);
      applyBrandingToCSS(data);
    } catch (err) {
      console.error('Failed to reset branding:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadBranding();
  }, [organization?.id]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        error,
        updateBranding,
        resetToDefaults,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}