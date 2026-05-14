import { templates } from './templates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TemplateConfig } from './types';
import { Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Cover-style mini preview that actually uses the template's fonts + colors,
 * so users can read the personality at a glance.
 */
function TemplateMiniPreview({ template }: { template: TemplateConfig }) {
  const { primaryColor, secondaryColor, headerFont, bodyFont } = template.defaults;
  const layout = template.coverLayout;
  // Ivory background for light templates so gold accents read; otherwise primary.
  const isLight = template.id === 'atelier';

  const titleStyle: React.CSSProperties = {
    fontFamily: `"${headerFont}", serif`,
    color: isLight ? primaryColor : '#fff',
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: '-0.01em',
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: `"${bodyFont}", sans-serif`,
    color: isLight ? '#555' : 'rgba(255,255,255,0.78)',
  };

  if (layout === 'split') {
    return (
      <div className="w-full h-32 rounded-md overflow-hidden flex border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="w-3/5 p-3 flex flex-col justify-end" style={{ backgroundColor: primaryColor }}>
          <div className="h-1 w-8 mb-2" style={{ backgroundColor: secondaryColor }} />
          <div className="text-[13px] leading-tight" style={titleStyle}>Proposal</div>
          <div className="text-[8px] mt-1 uppercase tracking-widest" style={bodyStyle}>For Acme Co.</div>
        </div>
        <div className="w-2/5 flex items-center justify-center" style={{ backgroundColor: secondaryColor, color: '#fff' }}>
          <div className="text-[8px] uppercase tracking-[0.25em] opacity-90" style={{ fontFamily: bodyStyle.fontFamily }}>2026</div>
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="w-full h-32 rounded-md overflow-hidden bg-[#faf8f3] flex flex-col items-center justify-center text-center px-4 border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="text-[7px] uppercase tracking-[0.3em] mb-2" style={{ color: secondaryColor, fontFamily: bodyStyle.fontFamily }}>Proposal</div>
        <div className="text-[15px]" style={{ ...titleStyle, color: primaryColor }}>Atelier</div>
        <div className="w-6 h-px my-2" style={{ backgroundColor: secondaryColor }} />
        <div className="text-[8px]" style={{ ...bodyStyle, color: '#777' }}>Prepared for Acme Co.</div>
      </div>
    );
  }

  if (layout === 'left-aligned') {
    return (
      <div className="w-full h-32 rounded-md overflow-hidden p-3 flex flex-col justify-center border" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
        <div className="text-[7px] uppercase tracking-[0.3em] opacity-70 mb-2" style={{ color: '#fff', fontFamily: bodyStyle.fontFamily }}>Section 01</div>
        <div className="text-[14px] mb-1" style={titleStyle}>Capitol</div>
        <div className="h-px w-12 my-1.5" style={{ backgroundColor: secondaryColor, opacity: 0.7 }} />
        <div className="text-[8px]" style={bodyStyle}>Formal proposal · 2026</div>
      </div>
    );
  }

  if (layout === 'diagonal') {
    return (
      <div className="w-full h-32 rounded-md overflow-hidden relative flex items-center justify-center text-center border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
        <div className="absolute inset-0" style={{ backgroundColor: secondaryColor, clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }} />
        <div className="relative z-10 px-2">
          <div className="text-[15px]" style={titleStyle}>Vanguard</div>
          <div className="text-[8px] mt-1.5 uppercase tracking-[0.25em]" style={bodyStyle}>Bold · 2026</div>
        </div>
      </div>
    );
  }

  // full-bleed (Sterling default)
  return (
    <div
      className="w-full h-32 rounded-md overflow-hidden flex flex-col items-center justify-center text-center px-3 relative border"
      style={{
        background: `linear-gradient(160deg, ${primaryColor} 0%, ${primaryColor} 70%, ${secondaryColor}33 100%)`,
        borderColor: 'hsl(var(--border))',
      }}
    >
      <div className="absolute top-3 left-0 right-0 mx-auto h-px w-10" style={{ backgroundColor: secondaryColor }} />
      <div className="text-[7px] uppercase tracking-[0.3em] mb-1" style={{ ...bodyStyle, color: secondaryColor }}>Proposal</div>
      <div className="text-[16px]" style={titleStyle}>{template.name}</div>
      <div className="h-px w-8 my-1.5" style={{ backgroundColor: secondaryColor }} />
      <div className="text-[8px]" style={bodyStyle}>Prepared for Acme Co.</div>
    </div>
  );
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {templates.map((t) => {
        const isSelected = selectedId === t.id;
        return (
          <Card
            key={t.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-2 overflow-hidden group',
              isSelected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border',
            )}
            onClick={() => onSelect(t.id)}
          >
            <CardContent className="p-2.5 space-y-2">
              <div className="relative">
                <TemplateMiniPreview template={t} />
                {isSelected && (
                  <Badge className="absolute top-1.5 right-1.5 gap-1 px-1.5 py-0.5 text-[10px]">
                    <Check className="h-3 w-3" /> Active
                  </Badge>
                )}
              </div>
              <div className="px-0.5">
                <p className="text-sm font-semibold leading-tight" style={{ fontFamily: `"${t.defaults.headerFont}", serif` }}>
                  {t.name}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
