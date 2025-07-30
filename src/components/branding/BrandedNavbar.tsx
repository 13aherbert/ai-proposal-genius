import { useBrandingContext } from './BrandingProvider';
import { Navbar } from '@/components/navigation/Navbar';

export function BrandedNavbar() {
  const { branding } = useBrandingContext();

  if (!branding) {
    return <Navbar />;
  }

  return (
    <nav 
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        backgroundColor: branding.backgroundColor,
        borderBottomColor: branding.secondaryColor + '20',
      }}
    >
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
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
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a 
              href="/dashboard" 
              className="transition-colors hover:text-foreground/80"
              style={{ color: branding.textColor }}
            >
              Dashboard
            </a>
            <a 
              href="/projects" 
              className="transition-colors hover:text-foreground/80"
              style={{ color: branding.textColor }}
            >
              Projects
            </a>
            <a 
              href="/knowledge-base" 
              className="transition-colors hover:text-foreground/80"
              style={{ color: branding.textColor }}
            >
              Knowledge Base
            </a>
          </nav>
        </div>
      </div>
    </nav>
  );
}