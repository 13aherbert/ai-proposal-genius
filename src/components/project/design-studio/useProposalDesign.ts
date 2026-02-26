import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { ContentBlock, DesignSettings, ProposalDesign } from './types';
import { getTemplate } from './templates';
import { v4 as uuidv4 } from 'uuid';

const MAX_HISTORY = 30;

interface HistoryEntry {
  blocks: ContentBlock[];
  settings: DesignSettings;
}

interface UseProposalDesignReturn {
  design: ProposalDesign | null;
  isLoading: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  updateBlocks: (blocks: ContentBlock[]) => void;
  updateSettings: (settings: DesignSettings) => void;
  updateTemplateId: (templateId: string) => void;
  saveNow: () => Promise<void>;
  undo: () => void;
  redo: () => void;
}

export function useProposalDesign(projectId: string): UseProposalDesignReturn {
  const { session } = useAuth();
  const [design, setDesign] = useState<ProposalDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Undo/redo history
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback((blocks: ContentBlock[], settings: DesignSettings) => {
    if (skipHistoryRef.current) return;
    const idx = historyIndexRef.current;
    // Truncate any redo entries
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push({ blocks: JSON.parse(JSON.stringify(blocks)), settings: { ...settings } });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // Load or create design
  useEffect(() => {
    if (!session?.user || !projectId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('proposal_designs' as any)
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          const d = data as any;
          const loaded: ProposalDesign = {
            id: d.id,
            project_id: d.project_id,
            organization_id: d.organization_id,
            user_id: d.user_id,
            template_id: d.template_id,
            design_settings: d.design_settings as DesignSettings,
            content_blocks: (d.content_blocks as ContentBlock[]) || [],
            created_at: d.created_at,
            updated_at: d.updated_at,
          };
          setDesign(loaded);
          pushHistory(loaded.content_blocks, loaded.design_settings);
        } else {
          const { data: project } = await supabase
            .from('projects')
            .select('organization_id, title, client_name')
            .eq('project_id', projectId)
            .single();

          if (!project) throw new Error('Project not found');

          const { data: sections } = await supabase
            .from('proposal_sections')
            .select('section_title, content')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

          const template = getTemplate('modern-corporate');

          // Check for default brand guideline
          let brandOverrides: Partial<DesignSettings> = {};
          try {
            const { data: defaultGuideline } = await supabase
              .from('organization_brand_guidelines' as any)
              .select('*')
              .eq('organization_id', project.organization_id)
              .eq('is_default', true)
              .maybeSingle();

            if (defaultGuideline) {
              const g = defaultGuideline as any;
              brandOverrides = {
                primaryColor: g.primary_color,
                secondaryColor: g.secondary_color,
                headerFont: g.header_font,
                bodyFont: g.body_font,
                headerStyle: g.header_style,
                coverLayout: g.cover_layout,
                margins: g.margins,
                sectionNumbering: g.section_numbering,
                logoUrl: g.logo_url ?? undefined,
              };
            }
          } catch (e) {
            console.warn('Could not load default brand guideline:', e);
          }

          const blocks: ContentBlock[] = [
            { id: uuidv4(), type: 'cover', content: { title: project.title || 'Proposal', subtitle: `Prepared for ${project.client_name || 'Client'}`, date: new Date().toLocaleDateString() } },
            { id: uuidv4(), type: 'toc', content: {} },
          ];

          if (sections && sections.length > 0) {
            for (const s of sections) {
              blocks.push({ id: uuidv4(), type: 'heading', content: { text: s.section_title, level: 2 } });
              blocks.push({ id: uuidv4(), type: 'text', content: { text: s.content || '' } });
            }
          }

          const newDesign = {
            project_id: projectId,
            organization_id: project.organization_id,
            user_id: session.user.id,
            template_id: template.id,
            design_settings: { ...template.defaults, headerStyle: template.headerStyle, coverLayout: template.coverLayout, ...brandOverrides },
            content_blocks: blocks,
          };

          const { data: inserted, error: insertErr } = await supabase
            .from('proposal_designs' as any)
            .insert(newDesign as any)
            .select()
            .single();

          if (insertErr) throw insertErr;

          const ins = inserted as any;
          const created: ProposalDesign = {
            id: ins.id,
            project_id: ins.project_id,
            organization_id: ins.organization_id,
            user_id: ins.user_id,
            template_id: ins.template_id,
            design_settings: ins.design_settings as DesignSettings,
            content_blocks: (ins.content_blocks as ContentBlock[]) || [],
            created_at: ins.created_at,
            updated_at: ins.updated_at,
          };
          setDesign(created);
          pushHistory(created.content_blocks, created.design_settings);
        }
      } catch (err: any) {
        console.error('Error loading proposal design:', err);
        toast.error('Failed to load proposal design');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [projectId, session?.user]);

  // Autosave every 10s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (dirtyRef.current && design) {
        saveDesign(design);
      }
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [design]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [design]);

  const saveDesign = async (d: ProposalDesign) => {
    if (!d) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('proposal_designs' as any)
        .update({
          template_id: d.template_id,
          design_settings: d.design_settings as any,
          content_blocks: d.content_blocks as any,
        } as any)
        .eq('id', d.id);

      if (error) throw error;
      dirtyRef.current = false;
    } catch (err) {
      console.error('Autosave failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlocks = useCallback((blocks: ContentBlock[]) => {
    setDesign(prev => {
      if (!prev) return null;
      pushHistory(blocks, prev.design_settings);
      return { ...prev, content_blocks: blocks };
    });
    dirtyRef.current = true;
  }, [pushHistory]);

  const updateSettings = useCallback((settings: DesignSettings) => {
    setDesign(prev => {
      if (!prev) return null;
      pushHistory(prev.content_blocks, settings);
      return { ...prev, design_settings: settings };
    });
    dirtyRef.current = true;
  }, [pushHistory]);

  const updateTemplateId = useCallback((templateId: string) => {
    const tmpl = getTemplate(templateId);
    setDesign(prev => {
      if (!prev) return null;
      const newSettings = { ...prev.design_settings, ...tmpl.defaults, headerStyle: tmpl.headerStyle, coverLayout: tmpl.coverLayout };
      pushHistory(prev.content_blocks, newSettings);
      return { ...prev, template_id: templateId, design_settings: newSettings };
    });
    dirtyRef.current = true;
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !design) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setDesign(prev => prev ? { ...prev, content_blocks: entry.blocks, design_settings: entry.settings } : null);
    dirtyRef.current = true;
    skipHistoryRef.current = false;
  }, [design]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !design) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setDesign(prev => prev ? { ...prev, content_blocks: entry.blocks, design_settings: entry.settings } : null);
    dirtyRef.current = true;
    skipHistoryRef.current = false;
  }, [design]);

  const saveNow = useCallback(async () => {
    if (design) {
      await saveDesign(design);
      toast.success('Design saved');
    }
  }, [design]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  return { design, isLoading, isSaving, canUndo, canRedo, updateBlocks, updateSettings, updateTemplateId, saveNow, undo, redo };
}
