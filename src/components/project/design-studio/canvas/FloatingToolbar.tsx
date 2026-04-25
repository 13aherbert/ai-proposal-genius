import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { useCanvasStore } from './CanvasStore';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';

interface FloatingToolbarProps {
  scale: number;
}

export function FloatingToolbar({ scale }: FloatingToolbarProps) {
  const store = useCanvasStore();
  const { doc, activePageId, selectedIds, isEditingTextId } = store;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const page = doc.pages.find(p => p.id === activePageId);
  const selectedEls = useMemo(
    () => (page?.elements ?? []).filter(e => selectedIds.includes(e.id)),
    [page, selectedIds],
  );
  const primary = selectedEls[0];

  // Position over the first selected element
  useEffect(() => {
    if (!primary) { setAnchor(null); return; }
    const node = document.querySelector(`[data-canvas-element-id="${primary.id}"]`) as HTMLElement | null;
    setAnchor(node);
  }, [primary, scale]);

  const { refs, floatingStyles } = useFloating({
    elements: { reference: anchor },
    placement: 'top',
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  if (!primary || isEditingTextId) return null;

  const updateText = (patch: Partial<NonNullable<typeof primary.text>>) => {
    if (!primary.text) return;
    store.updateElement(primary.id, { text: { ...primary.text, ...patch } });
    store.commit();
  };

  const updateShape = (patch: Partial<NonNullable<typeof primary.shape>>) => {
    if (!primary.shape) return;
    store.updateElement(primary.id, { shape: { ...primary.shape, ...patch } });
    store.commit();
  };

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 flex items-center gap-0.5 bg-background border rounded-lg shadow-lg p-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {primary.type === 'text' && primary.text && (
        <>
          <input
            type="number"
            value={primary.text.fontSize}
            onChange={(e) => updateText({ fontSize: Number(e.target.value) || 12 })}
            className="w-14 h-7 text-xs px-1 border rounded"
          />
          <Button variant={primary.text.fontWeight >= 600 ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ fontWeight: primary.text!.fontWeight >= 600 ? 400 : 700 })}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant={primary.text.italic ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ italic: !primary.text!.italic })}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant={primary.text.underline ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ underline: !primary.text!.underline })}>
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button variant={primary.text.align === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ align: 'left' })}>
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant={primary.text.align === 'center' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ align: 'center' })}>
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant={primary.text.align === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7"
            onClick={() => updateText({ align: 'right' })}>
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-7 w-7 rounded border" style={{ background: primary.text.color }} aria-label="Text color" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2"><HexColorPicker color={primary.text.color} onChange={(c) => updateText({ color: c })} /></PopoverContent>
          </Popover>
        </>
      )}

      {primary.type === 'shape' && primary.shape && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 w-7 rounded border" style={{ background: primary.shape.fill }} aria-label="Fill" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2"><HexColorPicker color={primary.shape.fill} onChange={(c) => updateShape({ fill: c })} /></PopoverContent>
        </Popover>
      )}

      <div className="w-px h-5 bg-border mx-1" />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.bringForward()} title="Bring forward">
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.sendBackward()} title="Send backward">
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.duplicateSelected()} title="Duplicate">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => store.deleteSelected()} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
