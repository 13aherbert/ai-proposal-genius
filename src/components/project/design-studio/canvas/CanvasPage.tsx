import { useCallback, useRef } from 'react';
import { useCanvasStore } from './CanvasStore';
import { CanvasElementView } from './CanvasElement';
import { backgroundToCss, CanvasPage as TPage } from './types';
import { useSignedUrl } from '../useSignedUrl';

interface CanvasPageViewProps {
  page: TPage;
  pageWidth: number;
  pageHeight: number;
  scale: number;
}

export function CanvasPageView({ page, pageWidth, pageHeight, scale }: CanvasPageViewProps) {
  const { selectedIds, clearSelection } = useCanvasStore();
  const ref = useRef<HTMLDivElement>(null);

  // Resolve signed URL for image backgrounds (when stored in Supabase storage)
  const resolvedBgUrl = useSignedUrl(page.background.imageUrl);
  const effectiveBg = page.background.type === 'image' && resolvedBgUrl
    ? { ...page.background, imageUrl: resolvedBgUrl }
    : page.background;

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === ref.current) clearSelection();
  }, [clearSelection]);

  // Sort elements by zIndex for consistent paint order
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="relative shadow-2xl"
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        // Internal coordinates remain pageWidth × pageHeight via CSS transform
      }}
    >
      <div
        ref={ref}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: pageWidth,
          height: pageHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ...backgroundToCss(effectiveBg),
        }}
        onPointerDown={handleBackgroundClick}
      >
        {effectiveBg.type === 'image' && (effectiveBg.overlayOpacity ?? 0) > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `rgba(0,0,0,${effectiveBg.overlayOpacity})` }}
          />
        )}
        {sorted.map(el => (
          <CanvasElementView
            key={el.id}
            element={el}
            scale={scale}
            selected={selectedIds.includes(el.id)}
          />
        ))}
      </div>
    </div>
  );
}
