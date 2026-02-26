import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { ContentBlock, DesignSettings, ProposalDesign } from './types';
import { getTemplate } from './templates';
import { v4 as uuidv4 } from 'uuid';

interface UseProposalDesignReturn {
  design: ProposalDesign | null;
  isLoading: boolean;
  isSaving: boolean;
  updateBlocks: (blocks: ContentBlock[]) => void;
  updateSettings: (settings: DesignSettings) => void;
  updateTemplateId: (templateId: string) => void;
  saveNow: () => Promise<void>;
}

export function useProposalDesign(projectId: string): UseProposalDesignReturn {
  const { session } = useAuth();
  const [design, setDesign] = useState<ProposalDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Load or create design
  useEffect(() => {
    if (!session?.user || !projectId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Try to load existing design
        const { data, error } = await supabase
          .from('proposal_designs' as any)
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          const d = data as any;
          setDesign({
            id: d.id,
            project_id: d.project_id,
            organization_id: d.organization_id,
            user_id: d.user_id,
            template_id: d.template_id,
            design_settings: d.design_settings as DesignSettings,
            content_blocks: (d.content_blocks as ContentBlock[]) || [],
            created_at: d.created_at,
            updated_at: d.updated_at,
          });
        } else {
          // Create new design - need org_id from project
          const { data: project } = await supabase
            .from('projects')
            .select('organization_id, title, client_name')
            .eq('project_id', projectId)
            .single();

          if (!project) throw new Error('Project not found');

          // Load proposal sections to map into blocks
          const { data: sections } = await supabase
            .from('proposal_sections')
            .select('section_title, content')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

          const template = getTemplate('modern-corporate');
          const blocks: ContentBlock[] = [
            {
              id: uuidv4(),
              type: 'cover',
              content: {
                title: project.title || 'Proposal',
                subtitle: `Prepared for ${project.client_name || 'Client'}`,
                date: new Date().toLocaleDateString(),
              },
            },
            { id: uuidv4(), type: 'toc', content: {} },
          ];

          if (sections && sections.length > 0) {
            for (const s of sections) {
              blocks.push({
                id: uuidv4(),
                type: 'heading',
                content: { text: s.section_title, level: 2 },
              });
              blocks.push({
                id: uuidv4(),
                type: 'text',
                content: { text: s.content || '' },
              });
            }
          }

          const newDesign = {
            project_id: projectId,
            organization_id: project.organization_id,
            user_id: session.user.id,
            template_id: template.id,
            design_settings: { ...template.defaults, headerStyle: template.headerStyle, coverLayout: template.coverLayout },
            content_blocks: blocks,
          };

          const { data: inserted, error: insertErr } = await supabase
            .from('proposal_designs' as any)
            .insert(newDesign as any)
            .select()
            .single();

          if (insertErr) throw insertErr;

          const ins = inserted as any;
          setDesign({
            id: ins.id,
            project_id: ins.project_id,
            organization_id: ins.organization_id,
            user_id: ins.user_id,
            template_id: ins.template_id,
            design_settings: ins.design_settings as DesignSettings,
            content_blocks: (ins.content_blocks as ContentBlock[]) || [],
            created_at: ins.created_at,
            updated_at: ins.updated_at,
          });
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
    setDesign(prev => prev ? { ...prev, content_blocks: blocks } : null);
    dirtyRef.current = true;
  }, []);

  const updateSettings = useCallback((settings: DesignSettings) => {
    setDesign(prev => prev ? { ...prev, design_settings: settings } : null);
    dirtyRef.current = true;
  }, []);

  const updateTemplateId = useCallback((templateId: string) => {
    const tmpl = getTemplate(templateId);
    setDesign(prev => prev ? { ...prev, template_id: templateId, design_settings: { ...prev.design_settings, ...tmpl.defaults, headerStyle: tmpl.headerStyle, coverLayout: tmpl.coverLayout } } : null);
    dirtyRef.current = true;
  }, []);

  const saveNow = useCallback(async () => {
    if (design) {
      await saveDesign(design);
      toast.success('Design saved');
    }
  }, [design]);

  return { design, isLoading, isSaving, updateBlocks, updateSettings, updateTemplateId, saveNow };
}
