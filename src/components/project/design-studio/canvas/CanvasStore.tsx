import { createContext, useContext, useCallback, useState, useRef, useMemo, ReactNode, useEffect } from 'react';
import { CanvasDocument, CanvasElement, CanvasPage, makeBlankDocument } from './types';
import { v4 as uuidv4 } from 'uuid';

const MAX_HISTORY = 50;

interface CanvasStore {
  doc: CanvasDocument;
  activePageId: string;
  selectedIds: string[];
  isEditingTextId: string | null;

  // Page ops
  setActivePage: (id: string) => void;
  addPage: () => void;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  movePage: (fromIdx: number, toIdx: number) => void;
  updatePageBackground: (pageId: string, bg: CanvasPage['background']) => void;

  // Element ops
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  updateElements: (updates: Array<{ id: string; patch: Partial<CanvasElement> }>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;

  // Selection
  selectIds: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  setEditingText: (id: string | null) => void;

  // History
  commit: () => void;          // push current doc to history (call after a gesture)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Replace whole doc (used by parent for persistence)
  replaceDoc: (next: CanvasDocument) => void;
}

const Ctx = createContext<CanvasStore | null>(null);

export function useCanvasStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCanvasStore must be used inside <CanvasStoreProvider>');
  return ctx;
}

interface ProviderProps {
  initialDoc?: CanvasDocument;
  onChange?: (doc: CanvasDocument) => void;
  children: ReactNode;
}

export function CanvasStoreProvider({ initialDoc, onChange, children }: ProviderProps) {
  const [doc, setDoc] = useState<CanvasDocument>(initialDoc ?? makeBlankDocument());
  const [activePageId, setActivePageId] = useState<string>(() => doc.pages[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditingTextId, setEditingText] = useState<string | null>(null);

  // Sync external initialDoc prop changes (e.g. when load completes)
  useEffect(() => {
    if (initialDoc) {
      setDoc(initialDoc);
      setActivePageId(initialDoc.pages[0]?.id ?? '');
      historyRef.current = [JSON.parse(JSON.stringify(initialDoc))];
      historyIdxRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDoc]);

  const historyRef = useRef<CanvasDocument[]>([JSON.parse(JSON.stringify(doc))]);
  const historyIdxRef = useRef(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  const commit = useCallback(() => {
    const idx = historyIdxRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(doc)));
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    historyIdxRef.current = historyRef.current.length - 1;
    setHistoryVersion(v => v + 1);
    onChange?.(doc);
  }, [doc, onChange]);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const next = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
    setDoc(next);
    setHistoryVersion(v => v + 1);
    onChange?.(next);
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const next = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
    setDoc(next);
    setHistoryVersion(v => v + 1);
    onChange?.(next);
  }, [onChange]);

  // Mutations -----------------------------------------------------------
  const updatePage = (pageId: string, fn: (p: CanvasPage) => CanvasPage) => {
    setDoc(prev => ({
      ...prev,
      pages: prev.pages.map(p => (p.id === pageId ? fn(p) : p)),
    }));
  };

  const updateActivePage = (fn: (p: CanvasPage) => CanvasPage) => updatePage(activePageId, fn);

  const setActivePage = useCallback((id: string) => {
    setActivePageId(id);
    setSelectedIds([]);
    setEditingText(null);
  }, []);

  const addPage = useCallback(() => {
    setDoc(prev => {
      const newPage: CanvasPage = { id: uuidv4(), background: { type: 'solid', color: '#ffffff' }, elements: [] };
      return { ...prev, pages: [...prev.pages, newPage] };
    });
  }, []);

  const duplicatePage = useCallback((id: string) => {
    setDoc(prev => {
      const idx = prev.pages.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const cloned: CanvasPage = {
        ...JSON.parse(JSON.stringify(prev.pages[idx])),
        id: uuidv4(),
        elements: prev.pages[idx].elements.map(el => ({ ...JSON.parse(JSON.stringify(el)), id: uuidv4() })),
      };
      const pages = [...prev.pages];
      pages.splice(idx + 1, 0, cloned);
      return { ...prev, pages };
    });
  }, []);

  const deletePage = useCallback((id: string) => {
    setDoc(prev => {
      if (prev.pages.length <= 1) return prev;
      return { ...prev, pages: prev.pages.filter(p => p.id !== id) };
    });
    setActivePageId(prev => {
      if (prev !== id) return prev;
      const remaining = doc.pages.filter(p => p.id !== id);
      return remaining[0]?.id ?? '';
    });
  }, [doc.pages]);

  const movePage = useCallback((fromIdx: number, toIdx: number) => {
    setDoc(prev => {
      const pages = [...prev.pages];
      const [m] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, m);
      return { ...prev, pages };
    });
  }, []);

  const updatePageBackground = useCallback((pageId: string, bg: CanvasPage['background']) => {
    updatePage(pageId, p => ({ ...p, background: bg }));
  }, []);

  const addElement = useCallback((el: CanvasElement) => {
    updateActivePage(p => ({ ...p, elements: [...p.elements, el] }));
    setSelectedIds([el.id]);
  }, [activePageId]);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    updateActivePage(p => ({
      ...p,
      elements: p.elements.map(e => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, [activePageId]);

  const updateElements = useCallback((updates: Array<{ id: string; patch: Partial<CanvasElement> }>) => {
    const map = new Map(updates.map(u => [u.id, u.patch]));
    updateActivePage(p => ({
      ...p,
      elements: p.elements.map(e => (map.has(e.id) ? { ...e, ...map.get(e.id)! } : e)),
    }));
  }, [activePageId]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    updateActivePage(p => ({ ...p, elements: p.elements.filter(e => !selectedIds.includes(e.id)) }));
    setSelectedIds([]);
    // Commit immediately because delete is a discrete action.
    setTimeout(() => commit(), 0);
  }, [selectedIds, commit, activePageId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedIds.length) return;
    const newIds: string[] = [];
    updateActivePage(p => {
      const clones = p.elements
        .filter(e => selectedIds.includes(e.id))
        .map(e => {
          const id = uuidv4();
          newIds.push(id);
          return { ...JSON.parse(JSON.stringify(e)), id, x: e.x + 20, y: e.y + 20 };
        });
      return { ...p, elements: [...p.elements, ...clones] };
    });
    setSelectedIds(newIds);
    setTimeout(() => commit(), 0);
  }, [selectedIds, commit, activePageId]);

  const bringForward = useCallback(() => {
    if (!selectedIds.length) return;
    updateActivePage(p => {
      const maxZ = Math.max(0, ...p.elements.map(e => e.zIndex));
      return {
        ...p,
        elements: p.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: maxZ + 1 } : e),
      };
    });
    setTimeout(() => commit(), 0);
  }, [selectedIds, commit, activePageId]);

  const sendBackward = useCallback(() => {
    if (!selectedIds.length) return;
    updateActivePage(p => {
      const minZ = Math.min(0, ...p.elements.map(e => e.zIndex));
      return {
        ...p,
        elements: p.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: minZ - 1 } : e),
      };
    });
    setTimeout(() => commit(), 0);
  }, [selectedIds, commit, activePageId]);

  const selectIds = useCallback((ids: string[], additive = false) => {
    setSelectedIds(prev => {
      if (additive) {
        const set = new Set(prev);
        for (const id of ids) {
          if (set.has(id)) set.delete(id); else set.add(id);
        }
        return Array.from(set);
      }
      return ids;
    });
    setEditingText(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setEditingText(null);
  }, []);

  const replaceDoc = useCallback((next: CanvasDocument) => {
    setDoc(next);
    setActivePageId(next.pages[0]?.id ?? '');
    setSelectedIds([]);
    historyRef.current = [JSON.parse(JSON.stringify(next))];
    historyIdxRef.current = 0;
    setHistoryVersion(v => v + 1);
  }, []);

  const value = useMemo<CanvasStore>(() => ({
    doc,
    activePageId,
    selectedIds,
    isEditingTextId,
    setActivePage,
    addPage,
    duplicatePage,
    deletePage,
    movePage,
    updatePageBackground,
    addElement,
    updateElement,
    updateElements,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    selectIds,
    clearSelection,
    setEditingText,
    commit,
    undo,
    redo,
    canUndo: historyIdxRef.current > 0,
    canRedo: historyIdxRef.current < historyRef.current.length - 1,
    replaceDoc,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [doc, activePageId, selectedIds, isEditingTextId, historyVersion, addPage, duplicatePage, deletePage, movePage, updatePageBackground, addElement, updateElement, updateElements, deleteSelected, duplicateSelected, bringForward, sendBackward, selectIds, clearSelection, commit, undo, redo, replaceDoc, setActivePage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
