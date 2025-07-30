import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './use-current-organization';
import { useProfile } from './use-profile';

export interface BrandingConfig {
  id?: string;
  organizationId: string;
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  customCss?: string;
  supportEmail?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { data: organization } = useCurrentOrganization(profile);

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    fetchBranding();
  }, [organization]);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization!)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBranding({
          id: data.id,
          organizationId: data.organization_id,
          brandName: data.brand_name || undefined,
          tagline: data.tagline || undefined,
          logoUrl: data.logo_url || undefined,
          faviconUrl: data.favicon_url || undefined,
          primaryColor: data.primary_color || '#3b82f6',
          secondaryColor: data.secondary_color || '#64748b',
          accentColor: data.accent_color || '#06b6d4',
          textColor: data.text_color || '#1e293b',
          backgroundColor: data.background_color || '#ffffff',
          fontFamily: data.font_family || 'Inter',
          customCss: data.custom_css || undefined,
          supportEmail: data.support_email || undefined,
          termsOfServiceUrl: data.terms_of_service_url || undefined,
          privacyPolicyUrl: data.privacy_policy_url || undefined,
        });
      } else {
        // Set default branding
        setBranding({
          organizationId: organization!,
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#06b6d4',
          textColor: '#1e293b',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branding');
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (updates: Partial<BrandingConfig>) => {
    if (!organization) return;

    try {
      setError(null);

      const brandingData = {
        organization_id: organization,
        brand_name: updates.brandName,
        tagline: updates.tagline,
        logo_url: updates.logoUrl,
        favicon_url: updates.faviconUrl,
        primary_color: updates.primaryColor,
        secondary_color: updates.secondaryColor,
        accent_color: updates.accentColor,
        text_color: updates.textColor,
        background_color: updates.backgroundColor,
        font_family: updates.fontFamily,
        custom_css: updates.customCss,
        support_email: updates.supportEmail,
        terms_of_service_url: updates.termsOfServiceUrl,
        privacy_policy_url: updates.privacyPolicyUrl,
      };

      const { data, error } = await supabase
        .from('organization_branding')
        .upsert(brandingData, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;

      setBranding(prev => prev ? { ...prev, ...updates } : null);
      
      // Apply branding to CSS custom properties
      applyBrandingToDOM(updates);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding');
      throw err;
    }
  };

  const applyBrandingToDOM = (brandingConfig: Partial<BrandingConfig>) => {
    const root = document.documentElement;
    
    if (brandingConfig.primaryColor) {
      const hsl = hexToHsl(brandingConfig.primaryColor);
      root.style.setProperty('--primary', hsl);
    }
    
    if (brandingConfig.secondaryColor) {
      const hsl = hexToHsl(brandingConfig.secondaryColor);
      root.style.setProperty('--secondary', hsl);
    }
    
    if (brandingConfig.accentColor) {
      const hsl = hexToHsl(brandingConfig.accentColor);
      root.style.setProperty('--accent', hsl);
    }
    
    if (brandingConfig.fontFamily) {
      root.style.setProperty('--font-family', brandingConfig.fontFamily);
    }
    
    if (brandingConfig.customCss) {
      // Inject custom CSS
      let styleElement = document.getElementById('custom-branding-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-branding-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = brandingConfig.customCss;
    }
  };

  // Apply branding when it loads
  useEffect(() => {
    if (branding) {
      applyBrandingToDOM(branding);
    }
  }, [branding]);

  return {
    branding,
    loading,
    error,
    updateBranding,
    refetch: fetchBranding,
  };
}

function hexToHsl(hex: string): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find greatest and smallest channel values
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  
  let h = 0;
  let s = 0;
  let l = 0;

  // Calculate hue
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply s and l by 100
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}