import { useCallback, useRef, useEffect } from 'react';

interface CanvasInteractionOpts {
  pageWidth: number;
  pageHeight: number;
  scale: number;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, edges: ResizeEdges, dx: number, dy: number, shift: boolean) => void;
  onCommit: () => void;        // push history once at end of gesture
  onSelect: (id: string | null, additive: boolean) => void;
}

export interface ResizeEdges {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
}

/**
 * Pointer-based drag/resize for a single element. Returns handlers to bind to
 * the element root and to each of the 8 resize handles.
 */
export function useElementDrag(elementId: string, opts: CanvasInteractionOpts) {
  const startRef = useRef<{ x: number; y: number; mode: 'move' | 'resize'; edges?: ResizeEdges } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent, mode: 'move' | 'resize', edges?: ResizeEdges) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, mode, edges };
    movedRef.current = false;

    if (mode === 'move') {
      // Selection happens on pointer-up if we didn't actually drag, OR immediately
      // so the user gets visual feedback. Do it now:
      opts.onSelect(elementId, e.shiftKey || e.metaKey || e.ctrlKey);
    }
  }, [elementId, opts]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const { x, y, mode, edges } = startRef.current;
    const dx = (e.clientX - x) / opts.scale;
    const dy = (e.clientY - y) / opts.scale;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !movedRef.current) return;
    movedRef.current = true;

    if (mode === 'move') {
      opts.onMove(elementId, dx, dy);
    } else if (edges) {
      opts.onResize(elementId, edges, dx, dy, e.shiftKey);
    }
    // Reset baseline so each move event reports incremental delta
    startRef.current.x = e.clientX;
    startRef.current.y = e.clientY;
  }, [elementId, opts]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (movedRef.current) opts.onCommit();
    startRef.current = null;
    movedRef.current = false;
  }, [opts]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

/**
 * Listen for arrow-key nudges and Delete on the document while focus is in the
 * canvas (handled by parent via a ref).
 */
export function useCanvasKeyboard(opts: {
  hasSelection: () => boolean;
  onNudge: (dx: number, dy: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isEditingText: () => boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger while typing in inputs / contenteditable
      const target = e.target as HTMLElement | null;
      if (opts.isEditingText()) return;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        opts.onUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        opts.onRedo();
        return;
      }
      if (!opts.hasSelection()) return;

      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); opts.onNudge(-step, 0); break;
        case 'ArrowRight': e.preventDefault(); opts.onNudge(step, 0); break;
        case 'ArrowUp':    e.preventDefault(); opts.onNudge(0, -step); break;
        case 'ArrowDown':  e.preventDefault(); opts.onNudge(0, step); break;
        case 'Delete':
        case 'Backspace':  e.preventDefault(); opts.onDelete(); break;
        case 'd':
        case 'D':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); opts.onDuplicate(); }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts]);
}

/** Compute snap-to-guide offsets given the moving element's new bounds and siblings. */
export function computeSnapOffset(
  bounds: { x: number; y: number; width: number; height: number },
  siblings: Array<{ x: number; y: number; width: number; height: number }>,
  pageWidth: number,
  pageHeight: number,
  threshold = 6,
): { dx: number; dy: number; guidesX: number[]; guidesY: number[] } {
  const targetsX = [0, pageWidth / 2, pageWidth];
  const targetsY = [0, pageHeight / 2, pageHeight];
  for (const s of siblings) {
    targetsX.push(s.x, s.x + s.width / 2, s.x + s.width);
    targetsY.push(s.y, s.y + s.height / 2, s.y + s.height);
  }

  const myXs = [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width];
  const myYs = [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height];

  let bestDx = 0, bestX = Infinity;
  const guidesX: number[] = [];
  for (const m of myXs) {
    for (const t of targetsX) {
      const d = t - m;
      if (Math.abs(d) < Math.abs(bestX) && Math.abs(d) <= threshold) {
        bestX = d; bestDx = d;
      }
      if (Math.abs(t - m) <= 0.5) guidesX.push(t);
    }
  }
  let bestDy = 0, bestY = Infinity;
  const guidesY: number[] = [];
  for (const m of myYs) {
    for (const t of targetsY) {
      const d = t - m;
      if (Math.abs(d) < Math.abs(bestY) && Math.abs(d) <= threshold) {
        bestY = d; bestDy = d;
      }
      if (Math.abs(t - m) <= 0.5) guidesY.push(t);
    }
  }
  return {
    dx: Number.isFinite(bestX) ? bestDx : 0,
    dy: Number.isFinite(bestY) ? bestDy : 0,
    guidesX,
    guidesY,
  };
}
