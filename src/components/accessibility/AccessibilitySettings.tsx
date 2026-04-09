import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Accessibility } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const A11Y_STORAGE_KEY = "optirfp_a11y_settings";

interface A11ySettings {
  highContrast: boolean;
  fontSize: number; // 16-24
}

function getSettings(): A11ySettings {
  try {
    const stored = localStorage.getItem(A11Y_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { highContrast: false, fontSize: 16 };
}

function applySettings(settings: A11ySettings) {
  const root = document.documentElement;
  root.classList.toggle("high-contrast", settings.highContrast);
  root.style.setProperty("--a11y-font-scale", String(settings.fontSize / 16));
  root.style.fontSize = `${settings.fontSize}px`;
}

// Apply on load (before React mounts)
if (typeof window !== "undefined") {
  applySettings(getSettings());
}

export function AccessibilitySettings() {
  const [settings, setSettings] = useState<A11ySettings>(getSettings);

  const update = useCallback((partial: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
      applySettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Accessibility settings"
          className="h-9 w-9"
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Accessibility</h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className="text-sm">
              High contrast
            </Label>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => update({ highContrast: checked })}
              aria-label="Toggle high contrast mode"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              Font size: {settings.fontSize}px
            </Label>
            <Slider
              min={16}
              max={24}
              step={1}
              value={[settings.fontSize]}
              onValueChange={([v]) => update({ fontSize: v })}
              aria-label={`Font size: ${settings.fontSize} pixels`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>16px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
