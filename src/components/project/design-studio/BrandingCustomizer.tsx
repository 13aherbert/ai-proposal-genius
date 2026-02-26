import { useCallback, useRef } from 'react';
import { DesignSettings, HeaderStyle, CoverLayout } from './types';
import { AVAILABLE_FONTS } from './templates';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface BrandingCustomizerProps {
  settings: DesignSettings;
  onChange: (settings: DesignSettings) => void;
  organizationId?: string;
}

const MARGIN_MAP = { 0: 'narrow' as const, 1: 'normal' as const, 2: 'wide' as const };
const MARGIN_REVERSE = { narrow: 0, normal: 1, wide: 2 };

const HEADER_STYLES: { value: HeaderStyle; label: string }[] = [
  { value: 'bold', label: 'Bold' },
  { value: 'underline', label: 'Underline' },
  { value: 'accent-bar', label: 'Accent Bar' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'gradient', label: 'Gradient' },
];

const COVER_LAYOUTS: { value: CoverLayout; label: string }[] = [
  { value: 'centered', label: 'Centered' },
  { value: 'left-aligned', label: 'Left Aligned' },
  { value: 'split', label: 'Split' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'full-bleed', label: 'Full Bleed' },
];

export function BrandingCustomizer({ settings, onChange, organizationId }: BrandingCustomizerProps) {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user || !organizationId) return;

    const ext = file.name.split('.').pop();
    const path = `${organizationId}/branding/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('rfp-files').upload(path, file);
    if (error) {
      toast.error('Logo upload failed');
      return;
    }

    const { data: urlData } = supabase.storage.from('rfp-files').getPublicUrl(path);
    update('logoUrl', urlData.publicUrl);
    toast.success('Logo uploaded');
  }, [organizationId, session, settings, onChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Branding & Style</h3>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Logo</Label>
        {settings.logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={settings.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain rounded border bg-white p-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update('logoUrl', undefined)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload Logo
          </Button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Primary Color</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              value={settings.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Secondary Color</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => update('secondaryColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input
              value={settings.secondaryColor}
              onChange={(e) => update('secondaryColor', e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Header Font</Label>
          <Select value={settings.headerFont} onValueChange={(v) => update('headerFont', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body Font</Label>
          <Select value={settings.bodyFont} onValueChange={(v) => update('bodyFont', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Header Style</Label>
          <Select value={settings.headerStyle || 'accent-bar'} onValueChange={(v) => update('headerStyle', v as HeaderStyle)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEADER_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cover Layout</Label>
          <Select value={settings.coverLayout || 'centered'} onValueChange={(v) => update('coverLayout', v as CoverLayout)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COVER_LAYOUTS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Page Margins: {settings.margins}</Label>
        <Slider
          value={[MARGIN_REVERSE[settings.margins]]}
          onValueChange={([v]) => update('margins', MARGIN_MAP[v as keyof typeof MARGIN_MAP])}
          min={0}
          max={2}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Narrow</span><span>Normal</span><span>Wide</span>
        </div>
      </div>
    </div>
  );
}
