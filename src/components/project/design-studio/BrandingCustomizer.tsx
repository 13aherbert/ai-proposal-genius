import { DesignSettings } from './types';
import { AVAILABLE_FONTS } from './templates';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface BrandingCustomizerProps {
  settings: DesignSettings;
  onChange: (settings: DesignSettings) => void;
}

const MARGIN_MAP = { 0: 'narrow' as const, 1: 'normal' as const, 2: 'wide' as const };
const MARGIN_REVERSE = { narrow: 0, normal: 1, wide: 2 };

export function BrandingCustomizer({ settings, onChange }: BrandingCustomizerProps) {
  const update = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Branding & Style</h3>

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
