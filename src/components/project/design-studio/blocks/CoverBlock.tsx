import { ContentBlock, DesignSettings, CoverLayout } from '../types';
import { Input } from '@/components/ui/input';
import { useSignedUrl } from '../useSignedUrl';

interface CoverBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function CoverBlock({ block, settings, onUpdate, preview }: CoverBlockProps) {
  const { title, subtitle, date } = block.content as { title?: string; subtitle?: string; date?: string };
  const layout: CoverLayout = settings.coverLayout || 'centered';
  const resolvedLogoUrl = useSignedUrl(settings.logoUrl);

  const updateField = (field: string, value: string) => {
    onUpdate({ ...block, content: { ...block.content, [field]: value } });
  };

  if (preview) {
    const logo = resolvedLogoUrl ? (
      <img src={resolvedLogoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
    ) : null;

    switch (layout) {
      case 'left-aligned':
        return (
          <div className="min-h-[400px] flex flex-col justify-center p-12 rounded-lg" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
            {logo && <div className="mb-6">{logo}</div>}
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
            <p className="text-xl opacity-90 mb-4" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
            <p className="text-sm opacity-70">{date}</p>
          </div>
        );

      case 'split':
        return (
          <div className="min-h-[400px] flex rounded-lg overflow-hidden">
            <div className="w-1/2 flex flex-col justify-center p-10" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
              {logo && <div className="mb-6">{logo}</div>}
              <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
              <p className="text-sm opacity-70">{date}</p>
            </div>
            <div className="w-1/2 flex flex-col justify-center p-10" style={{ backgroundColor: settings.secondaryColor, color: '#fff' }}>
              <p className="text-lg opacity-90" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div className="min-h-[400px] flex flex-col justify-center items-center text-center p-12 rounded-lg border-2" style={{ borderColor: settings.primaryColor }}>
            {logo && <div className="mb-8">{logo}</div>}
            <h1 className="text-3xl font-semibold mb-3" style={{ fontFamily: settings.headerFont, color: settings.primaryColor }}>{title || 'Proposal Title'}</h1>
            <div className="w-16 h-0.5 my-4" style={{ backgroundColor: settings.primaryColor }} />
            <p className="text-lg opacity-80" style={{ fontFamily: settings.bodyFont, color: settings.secondaryColor }}>{subtitle || 'Subtitle'}</p>
            <p className="text-sm opacity-60 mt-4" style={{ color: settings.secondaryColor }}>{date}</p>
          </div>
        );

      case 'full-bleed':
        return (
          <div
            className="min-h-[400px] flex flex-col items-center justify-end text-center p-12 rounded-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`, color: '#fff' }}
          >
            {logo && <div className="absolute top-8 left-8">{logo}</div>}
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
            <p className="text-xl opacity-90 mb-2" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
            <p className="text-sm opacity-70">{date}</p>
          </div>
        );

      default: // centered
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 rounded-lg" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
            {logo && <div className="mb-6">{logo}</div>}
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
            <p className="text-xl opacity-90 mb-6" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
            <p className="text-sm opacity-70">{date}</p>
          </div>
        );
    }
  }

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Page</p>
      <Input placeholder="Proposal Title" value={String(title || '')} onChange={(e) => updateField('title', e.target.value)} />
      <Input placeholder="Subtitle / Client Name" value={String(subtitle || '')} onChange={(e) => updateField('subtitle', e.target.value)} />
      <Input placeholder="Date" value={String(date || '')} onChange={(e) => updateField('date', e.target.value)} />
    </div>
  );
}
