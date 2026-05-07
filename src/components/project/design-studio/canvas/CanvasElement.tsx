import { memo, useCallback, useMemo } from 'react';
import { CanvasElement as TElement } from './types';
import { TextRenderer } from './elements/TextRenderer';
import { ImageRenderer } from './elements/ImageRenderer';
import { ShapeRenderer } from './elements/ShapeRenderer';
import { IconRenderer } from './elements/IconRenderer';
import { useElementDrag, ResizeEdges } from './hooks/useCanvasInteraction';
import { useCanvasStore } from './CanvasStore';
import { cn } from '@/lib/utils';

interface CanvasElementProps {
  element: TElement;
  scale: number;
  selected: boolean;
}

const HANDLE_POSITIONS: Array<{ key: string; edges: ResizeEdges; cursor: string; style: React.CSSProperties }> = [
  { key: 'nw', edges: { top: true, left: true },     cursor: 'nwse-resize', style: { top: -5, left: -5 } },
  { key: 'n',  edges: { top: true },                  cursor: 'ns-resize',   style: { top: -5, left: '50%', marginLeft: -5 } },
  { key: 'ne', edges: { top: true, right: true },    cursor: 'nesw-resize', style: { top: -5, right: -5 } },
  { key: 'e',  edges: { right: true },                cursor: 'ew-resize',   style: { top: '50%', right: -5, marginTop: -5 } },
  { key: 'se', edges: { bottom: true, right: true }, cursor: 'nwse-resize', style: { bottom: -5, right: -5 } },
  { key: 's',  edges: { bottom: true },               cursor: 'ns-resize',   style: { bottom: -5, left: '50%', marginLeft: -5 } },
  { key: 'sw', edges: { bottom: true, left: true },  cursor: 'nesw-resize', style: { bottom: -5, left: -5 } },
  { key: 'w',  edges: { left: true },                 cursor: 'ew-resize',   style: { top: '50%', left: -5, marginTop: -5 } },
];

function CanvasElementInner({ element, scale, selected }: CanvasElementProps) {
  const { updateElement, commit, selectIds, isEditingTextId, setEditingText } = useCanvasStore();
  const editing = isEditingTextId === element.id;

  const handleMove = useCallback((id: string, dx: number, dy: number) => {
    updateElement(id, { x: element.x + dx, y: element.y + dy });
    // Note: dx/dy are accumulated from baseline reset each event, so update directly with current position.
    // The interaction hook resets baseline each move, so dx/dy represent incremental movement only.
  }, [element.x, element.y, updateElement]);

  // Because the hook resets baseline each event, dx/dy is per-event delta.
  // We need to read the latest x/y at apply time; do it via functional update.
  const moveByDelta = useCallback((id: string, dx: number, dy: number) => {
    updateElement(id, {
      x: Math.round(element.x + dx),
      y: Math.round(element.y + dy),
    });
  }, [element.x, element.y, updateElement]);

  const resizeByDelta = useCallback((id: string, edges: ResizeEdges, dx: number, dy: number, shift: boolean) => {
    let { x, y, width, height } = element;
    if (edges.left)   { x += dx; width -= dx; }
    if (edges.right)  { width += dx; }
    if (edges.top)    { y += dy; height -= dy; }
    if (edges.bottom) { height += dy; }
    width = Math.max(8, width);
    height = Math.max(8, height);
    if (shift && element.width > 0 && element.height > 0) {
      const ratio = element.width / element.height;
      // Lock aspect from corner handles
      if ((edges.left || edges.right) && (edges.top || edges.bottom)) {
        height = width / ratio;
        if (edges.top) y = element.y + (element.height - height);
      }
    }
    updateElement(id, {
      x: Math.round(x), y: Math.round(y),
      width: Math.round(width), height: Math.round(height),
    });
  }, [element, updateElement]);

  const handlers = useElementDrag(element.id, {
    pageWidth: 0, pageHeight: 0, scale,
    onMove: moveByDelta,
    onResize: resizeByDelta,
    onCommit: commit,
    onSelect: (id, additive) => selectIds(id ? [id] : [], additive),
  });

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (element.type === 'text') {
      e.stopPropagation();
      setEditingText(element.id);
    }
  }, [element.id, element.type, setEditingText]);

  const onTextChange = useCallback((html: string) => {
    if (element.text) updateElement(element.id, { text: { ...element.text, html } });
  }, [element.id, element.text, updateElement]);

  const wrapperStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    // Text elements grow with content — give a min-height instead of a fixed height
    // so wrapping text is never clipped at the bottom of the box.
    ...(element.type === 'text'
      ? { minHeight: element.height }
      : { height: element.height }),
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: element.zIndex,
    cursor: editing ? 'text' : 'move',
    touchAction: 'none',
  }), [element.x, element.y, element.width, element.height, element.rotation, element.zIndex, element.type, editing]);

  return (
    <div
      style={wrapperStyle}
      onPointerDown={editing ? undefined : (e) => handlers.onPointerDown(e, 'move')}
      onPointerMove={editing ? undefined : handlers.onPointerMove}
      onPointerUp={editing ? undefined : handlers.onPointerUp}
      onDoubleClick={handleDoubleClick}
      data-canvas-element-id={element.id}
    >
      {/* Element content */}
      <div className="w-full h-full" style={{ pointerEvents: editing ? 'auto' : 'none' }}>
        {element.type === 'text' && element.text && (
          <TextRenderer
            text={element.text}
            editing={editing}
            onChange={onTextChange}
            onExitEdit={() => { setEditingText(null); commit(); }}
          />
        )}
        {element.type === 'image' && element.image && <ImageRenderer image={element.image} />}
        {element.type === 'shape' && element.shape && <ShapeRenderer shape={element.shape} width={element.width} height={element.height} />}
        {element.type === 'icon' && element.icon && <IconRenderer icon={element.icon} />}
      </div>

      {/* Selection outline + handles */}
      {selected && !editing && (
        <>
          <div
            className={cn('absolute inset-0 pointer-events-none ring-2 ring-primary')}
            style={{ outlineOffset: 2 }}
          />
          {HANDLE_POSITIONS.map(h => (
            <div
              key={h.key}
              role="button"
              aria-label={`Resize ${h.key}`}
              onPointerDown={(e) => handlers.onPointerDown(e, 'resize', h.edges)}
              onPointerMove={handlers.onPointerMove}
              onPointerUp={handlers.onPointerUp}
              style={{
                position: 'absolute',
                width: 10, height: 10,
                background: 'white',
                border: '1.5px solid hsl(var(--primary))',
                borderRadius: 2,
                cursor: h.cursor,
                touchAction: 'none',
                ...h.style,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

export const CanvasElementView = memo(CanvasElementInner);
