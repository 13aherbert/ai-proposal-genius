import { ContentBlock, DesignSettings, CoverLayout } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, X, Search } from 'lucide-react';
import { useSignedUrl } from '../useSignedUrl';
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { StockImageSearch } from '../StockImageSearch';

interface CoverBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
  organizationId?: string;
}

export function CoverBlock({ block, settings, onUpdate, preview, organizationId }: CoverBlockProps) {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const { title, subtitle, date, coverImageUrl } = block.content as { title?: string; subtitle?: string; date?: string; coverImageUrl?: string };
  const layout: CoverLayout = settings.coverLayout || 'centered';
  const resolvedLogoUrl = useSignedUrl(settings.logoUrl);
  const resolvedCoverImage = useSignedUrl(coverImageUrl);

  const updateField = (field: string, value: string) => {
    onUpdate({ ...block, content: { ...block.content, [field]: value } });
  };

  const handleCoverImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user || !organizationId) return;
    const ext = file.name.split('.').pop();
    const path = `${organizationId}/design-assets/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('rfp-files').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data: urlData } = supabase.storage.from('rfp-files').getPublicUrl(path);
    onUpdate({ ...block, content: { ...block.content, coverImageUrl: urlData.publicUrl } });
  }, [block, onUpdate, organizationId, session]);

  if (preview) {
    const logo = resolvedLogoUrl ? (
      <img src={resolvedLogoUrl} alt="Logo" className="max-h-16 max-w-[200px] object-contain" />
    ) : null;

    const bgImage = resolvedCoverImage;

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

      case 'banner':
        return (
          <div className="min-h-[400px] flex flex-col rounded-lg overflow-hidden relative">
            <div
              className="flex-1 min-h-[260px]"
              style={{
                background: bgImage
                  ? `url(${bgImage}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
              }}
            />
            <div className="p-8" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
              {logo && <div className="mb-3">{logo}</div>}
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
              <p className="text-base opacity-90 mb-1" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
              <p className="text-sm opacity-70">{date}</p>
            </div>
          </div>
        );

      case 'sidebar':
        return (
          <div className="min-h-[400px] flex rounded-lg overflow-hidden">
            <div className="w-[30%] flex flex-col justify-between p-8" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
              {logo && <div className="mb-auto">{logo}</div>}
              <div className="space-y-2 mt-auto">
                <p className="text-xs uppercase tracking-widest opacity-70">Date</p>
                <p className="text-sm font-medium">{date}</p>
                <p className="text-xs uppercase tracking-widest opacity-70 mt-4">Prepared by</p>
                <p className="text-sm font-medium">{subtitle || 'Your Company'}</p>
              </div>
            </div>
            <div className="w-[70%] flex flex-col justify-center p-12 bg-white">
              <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: settings.headerFont, color: settings.primaryColor }}>{title || 'Proposal Title'}</h1>
              <p className="text-lg" style={{ fontFamily: settings.bodyFont, color: settings.secondaryColor }}>{subtitle || 'Subtitle'}</p>
            </div>
          </div>
        );

      case 'diagonal':
        return (
          <div className="min-h-[400px] rounded-lg overflow-hidden relative flex items-center justify-center text-center p-12">
            <div className="absolute inset-0" style={{ backgroundColor: settings.primaryColor }} />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: settings.secondaryColor,
                clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)',
              }}
            />
            <div className="relative z-10" style={{ color: '#fff' }}>
              {logo && <div className="mb-6 flex justify-center">{logo}</div>}
              <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
              <p className="text-xl opacity-90 mb-2" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
              <p className="text-sm opacity-70">{date}</p>
            </div>
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

      {/* Cover Image Upload */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Cover Image (optional)</p>
        {coverImageUrl ? (
          <div className="space-y-2">
            <img src={resolvedCoverImage || coverImageUrl} alt="" className="max-h-24 rounded mx-auto" />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw className="h-3 w-3" /> Replace
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive" onClick={() => updateField('coverImageUrl', '')}>
                <X className="h-3 w-3" /> Remove
              </Button>
            </div>
          </div>
      ) : (
          <div className="space-y-2">
            <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Upload cover image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
            </label>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => setStockSearchOpen(true)}>
              <Search className="h-3 w-3" /> Search Stock Images
            </Button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
      </div>
      <StockImageSearch
        open={stockSearchOpen}
        onOpenChange={setStockSearchOpen}
        onSelect={(url) => updateField('coverImageUrl', url)}
        initialQuery={String(title || 'professional business')}
      />
    </div>
  );
}
