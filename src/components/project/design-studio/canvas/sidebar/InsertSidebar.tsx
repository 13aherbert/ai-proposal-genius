import { useState, useRef } from 'react';
import { useCanvasStore } from '../CanvasStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Type, Square, Image as ImageIcon, Layout, Palette,
  Star, Heart, Check, Award, Zap, Target, TrendingUp, Shield, Lightbulb, Rocket,
  type LucideIcon,
} from 'lucide-react';
import { makeTextElement, makeShapeElement, makeImageElement, makeIconElement, TEXT_PRESETS } from '../elementFactory';
import { ShapeKind, BackgroundType } from '../types';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { StockImageSearch } from '../../StockImageSearch';

interface InsertSidebarProps {
  organizationId?: string;
}

const SHAPE_OPTIONS: Array<{ kind: ShapeKind; label: string }> = [
  { kind: 'rect', label: 'Rectangle' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'line', label: 'Line' },
  { kind: 'arrow', label: 'Arrow' },
];

const ICON_OPTIONS: Array<{ name: string; Icon: LucideIcon }> = [
  { name: 'Star', Icon: Star }, { name: 'Heart', Icon: Heart }, { name: 'Check', Icon: Check },
  { name: 'Award', Icon: Award }, { name: 'Zap', Icon: Zap }, { name: 'Target', Icon: Target },
  { name: 'TrendingUp', Icon: TrendingUp }, { name: 'Shield', Icon: Shield },
  { name: 'Lightbulb', Icon: Lightbulb }, { name: 'Rocket', Icon: Rocket },
];

export function InsertSidebar({ organizationId }: InsertSidebarProps) {
  const store = useCanvasStore();
  const { doc, activePageId } = store;
  const activePage = doc.pages.find(p => p.id === activePageId);
  const [stockOpen, setStockOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();

  const addEl = (factory: () => ReturnType<typeof makeTextElement>) => {
    store.addElement(factory());
    store.commit();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user || !organizationId) return;
    const ext = file.name.split('.').pop();
    const path = `${organizationId}/design-assets/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('rfp-files').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data } = supabase.storage.from('rfp-files').getPublicUrl(path);
    addEl(() => makeImageElement(data.publicUrl));
    e.target.value = '';
  };

  const setBackground = (type: BackgroundType, value: Record<string, unknown>) => {
    if (!activePage) return;
    store.updatePageBackground(activePage.id, { type, ...value } as never);
    store.commit();
  };

  return (
    <div className="w-64 shrink-0 bg-background border rounded-lg overflow-hidden flex flex-col">
      <Tabs defaultValue="text" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-5 m-2 h-9">
          <TabsTrigger value="text" className="px-1 gap-1 text-[11px]" title="Text"><Type className="h-3.5 w-3.5" /><span className="hidden xl:inline">Text</span></TabsTrigger>
          <TabsTrigger value="elements" className="px-1 gap-1 text-[11px]" title="Shapes & icons"><Square className="h-3.5 w-3.5" /><span className="hidden xl:inline">Shapes</span></TabsTrigger>
          <TabsTrigger value="images" className="px-1 gap-1 text-[11px]" title="Images"><ImageIcon className="h-3.5 w-3.5" /><span className="hidden xl:inline">Image</span></TabsTrigger>
          <TabsTrigger value="bg" className="px-1 gap-1 text-[11px]" title="Background"><Palette className="h-3.5 w-3.5" /><span className="hidden xl:inline">BG</span></TabsTrigger>
          <TabsTrigger value="pages" className="px-1 gap-1 text-[11px]" title="Pages"><Layout className="h-3.5 w-3.5" /><span className="hidden xl:inline">Pages</span></TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <TabsContent value="text" className="space-y-2 mt-0">
            <p className="text-xs font-medium text-muted-foreground">Text styles</p>
            {TEXT_PRESETS.map((preset) => (
              <button key={preset.label}
                onClick={() => addEl(() => makeTextElement({ width: preset.size.w, height: preset.size.h }, { ...preset.props, html: preset.html }))}
                className="w-full text-left px-3 py-2 rounded hover:bg-muted border"
                style={{ fontSize: Math.min(preset.props.fontSize ?? 14, 22), fontWeight: preset.props.fontWeight }}>
                {preset.label}
              </button>
            ))}
          </TabsContent>

          <TabsContent value="elements" className="space-y-3 mt-0">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Shapes</p>
              <div className="grid grid-cols-2 gap-2">
                {SHAPE_OPTIONS.map(s => (
                  <Button key={s.kind} variant="outline" size="sm"
                    onClick={() => addEl(() => makeShapeElement(s.kind))}>{s.label}</Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Icons</p>
              <div className="grid grid-cols-5 gap-1">
                {ICON_OPTIONS.map(name => (
                  <button key={name} onClick={() => addEl(() => makeIconElement(name))}
                    className="aspect-square flex items-center justify-center border rounded hover:bg-muted text-xs" title={name}>
                    {name.slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-2 mt-0">
            <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>Upload image</Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button variant="outline" size="sm" className="w-full" onClick={() => setStockOpen(true)}>Search stock</Button>
            <StockImageSearch open={stockOpen} onOpenChange={setStockOpen}
              onSelect={(url) => addEl(() => makeImageElement(url))} initialQuery="business" />
          </TabsContent>

          <TabsContent value="bg" className="space-y-3 mt-0">
            <p className="text-xs font-medium text-muted-foreground">Page background</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <span className="w-4 h-4 rounded border" style={{ background: activePage?.background.color || '#fff' }} />
                  Solid color
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <HexColorPicker color={activePage?.background.color || '#ffffff'}
                  onChange={(c) => setBackground('solid', { color: c })} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => setBackground('gradient', { gradient: { from: '#3B82F6', to: '#8B5CF6', angle: 135 } })}>
              Apply gradient
            </Button>
          </TabsContent>

          <TabsContent value="pages" className="space-y-2 mt-0">
            {doc.pages.map((p, idx) => (
              <button key={p.id}
                onClick={() => store.setActivePage(p.id)}
                className={`w-full text-left px-3 py-2 rounded border text-xs ${p.id === activePageId ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                Page {idx + 1} <span className="text-muted-foreground">({p.elements.length})</span>
              </button>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => { store.addPage(); store.commit(); }}>+ Add page</Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
