import { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasStoreProvider, useCanvasStore } from './CanvasStore';
import { CanvasPageView } from './CanvasPage';
import { CanvasDocument, DEFAULT_PAGE_SIZE } from './types';
import { useCanvasKeyboard } from './hooks/useCanvasInteraction';
import { InsertSidebar } from './sidebar/InsertSidebar';
import { FloatingToolbar } from './FloatingToolbar';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CanvasEditorProps {
  document: CanvasDocument;
  organizationId?: string;
  onChange: (doc: CanvasDocument) => void;
}

export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <CanvasStoreProvider initialDoc={props.document} onChange={props.onChange}>
      <CanvasEditorInner organizationId={props.organizationId} />
    </CanvasStoreProvider>
  );
}

function CanvasEditorInner({ organizationId }: { organizationId?: string }) {
  const store = useCanvasStore();
  const { doc, activePageId, selectedIds, isEditingTextId } = store;
  const [zoom, setZoom] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePage = doc.pages.find(p => p.id === activePageId) ?? doc.pages[0];
  const activeIdx = doc.pages.findIndex(p => p.id === activePage?.id);

  useCanvasKeyboard({
    hasSelection: () => selectedIds.length > 0,
    onNudge: (dx, dy) => {
      const updates = selectedIds
        .map(id => activePage?.elements.find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e!.id, patch: { x: e!.x + dx, y: e!.y + dy } }));
      store.updateElements(updates);
    },
    onDelete: store.deleteSelected,
    onDuplicate: store.duplicateSelected,
    onUndo: store.undo,
    onRedo: store.redo,
    isEditingText: () => isEditingTextId !== null,
  });

  // "Fit width" — make the page fill the available width (capped at 1.0).
  // Falls back to fit-to-container when the page is taller than the viewport.
  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth - 48;
    const widthScale = Math.min(w / doc.pageSize.width, 1);
    setZoom(Math.max(0.3, widthScale));
  }, [doc.pageSize]);

  useEffect(() => {
    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, [fitToContainer]);

  if (!activePage) return null;

  return (
    <div className="flex gap-3 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left sidebar */}
      <InsertSidebar organizationId={organizationId} />

      {/* Canvas area */}
      <div className="flex-1 flex flex-col bg-muted/30 rounded-lg overflow-hidden relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => activeIdx > 0 && store.setActivePage(doc.pages[activeIdx - 1].id)}
              disabled={activeIdx <= 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium tabular-nums">
              Page {activeIdx + 1} of {doc.pages.length}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => activeIdx < doc.pages.length - 1 && store.setActivePage(doc.pages[activeIdx + 1].id)}
              disabled={activeIdx >= doc.pages.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 ml-2"
              onClick={() => { store.addPage(); store.commit(); }}>
              <Plus className="h-3.5 w-3.5" /> Page
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 ml-2" onClick={fitToContainer}>Fit</Button>
          </div>
        </div>

        {/* Scrollable canvas viewport */}
        <div ref={containerRef} className="flex-1 overflow-auto p-6 flex items-start justify-center">
          <CanvasPageView
            page={activePage}
            pageWidth={doc.pageSize.width}
            pageHeight={doc.pageSize.height}
            scale={zoom}
          />
        </div>

        {/* Floating contextual toolbar */}
        <FloatingToolbar scale={zoom} />
      </div>
    </div>
  );
}
