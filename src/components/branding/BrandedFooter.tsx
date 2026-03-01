import { useBrandingContext } from './BrandingProvider';
import { Footer } from '@/components/navigation/Footer';

export function BrandedFooter() {
  const { branding } = useBrandingContext();

  if (!branding) {
    return <Footer />;
  }

  return (
    <footer 
      className="border-t bg-background"
      style={{
        backgroundColor: branding.backgroundColor,
        borderTopColor: branding.secondaryColor + '20',
      }}
    >
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.brandName || 'Logo'} 
                className="h-8 w-auto"
              />
            ) : (
              <span 
                className="font-bold text-xl"
                style={{ 
                  color: branding.primaryColor,
                  fontFamily: branding.fontFamily 
                }}
              >
                {branding.brandName || 'Brand'}
              </span>
            )}
            {branding.tagline && (
              <p 
                className="text-sm"
                style={{ 
                  color: branding.textColor,
                  fontFamily: branding.fontFamily 
                }}
              >
                {branding.tagline}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold"
              style={{ 
                color: branding.primaryColor,
                fontFamily: branding.fontFamily 
              }}
            >
              Product
            </h4>
            <nav className="space-y-2">
              <a 
                href="/dashboard" 
                className="block text-sm transition-colors hover:text-foreground/80"
                style={{ color: branding.textColor }}
              >
                Dashboard
              </a>
              <a 
                href="/projects" 
                className="block text-sm transition-colors hover:text-foreground/80"
                style={{ color: branding.textColor }}
              >
                Projects
              </a>
              <a 
                href="/knowledge-base" 
                className="block text-sm transition-colors hover:text-foreground/80"
                style={{ color: branding.textColor }}
              >
                Knowledge Base
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold"
              style={{ 
                color: branding.primaryColor,
                fontFamily: branding.fontFamily 
              }}
            >
              Support
            </h4>
            <nav className="space-y-2">
              {branding.supportEmail && (
                <a 
                  href={`mailto:${branding.supportEmail}`} 
                  className="block text-sm transition-colors hover:text-foreground/80"
                  style={{ color: branding.textColor }}
                >
                  Contact Support
                </a>
              )}
              <a 
                href="/help" 
                className="block text-sm transition-colors hover:text-foreground/80"
                style={{ color: branding.textColor }}
              >
                Help Center
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 
              className="text-sm font-semibold"
              style={{ 
                color: branding.primaryColor,
                fontFamily: branding.fontFamily 
              }}
            >
              Legal
            </h4>
            <nav className="space-y-2">
              {branding.privacyPolicyUrl && (
                <a 
                  href={branding.privacyPolicyUrl} 
                  className="block text-sm transition-colors hover:text-foreground/80"
                  style={{ color: branding.textColor }}
                >
                  Privacy Policy
                </a>
              )}
              {branding.termsOfServiceUrl && (
                <a 
                  href={branding.termsOfServiceUrl} 
                  className="block text-sm transition-colors hover:text-foreground/80"
                  style={{ color: branding.textColor }}
                >
                  Terms of Service
                </a>
              )}
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t pt-8" style={{ borderTopColor: branding.secondaryColor + '20' }}>
          <p 
            className="text-center text-sm"
            style={{ 
              color: branding.textColor,
              fontFamily: branding.fontFamily 
            }}
          >
            © 2026 {branding.brandName || 'Company'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}