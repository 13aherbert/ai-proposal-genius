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
  isRegenerating: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Number of proposal sections in the DB not represented as headings in the design. */
  missingSectionCount: number;
  updateBlocks: (blocks: ContentBlock[]) => void;
  updateSettings: (settings: DesignSettings) => void;
  updateTemplateId: (templateId: string) => void;
  saveNow: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  regenerateDesign: () => Promise<void>;
}

// Normalize markdown heading lines: strip bold markers around heading text (### **Title** → ### Title)
function cleanMarkdownHeadings(text: string): string {
  return text.replace(/^(#{1,4})\s+\*{1,3}(.*?)\*{1,3}\s*$/gm, '$1 $2');
}

// Smart layout engine: maps section title keywords to richer block structures
function mapSectionToBlocks(sectionTitle: string, content: string): ContentBlock[] {
  const title = sectionTitle.toLowerCase();
  // Strip markdown bold/italic from section title
  const cleanTitle = sectionTitle.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1').replace(/_{1,3}(.*?)_{1,3}/g, '$1');
  // Clean markdown headings in content
  const cleanContent = cleanMarkdownHeadings(content || '');
  const blocks: ContentBlock[] = [];

  // Always start with a heading
  blocks.push({ id: uuidv4(), type: 'heading', content: { text: cleanTitle, level: 2 } });

  if (title.includes('executive') && title.includes('summary')) {
    // Extract first sentence as a callout highlight
    const firstSentence = cleanContent?.split(/[.!?]\s/)?.[0] || '';
    if (firstSentence && cleanContent) {
      blocks.push({ id: uuidv4(), type: 'callout', content: { text: firstSentence + '.', style: 'info' } });
    }
    blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    const imageQuery = extractImageQuery(sectionTitle, cleanContent);
    blocks.push({ id: uuidv4(), type: 'image', content: { url: '', caption: '', suggestedImageQuery: imageQuery } });
  } else if (title.includes('timeline') || title.includes('schedule') || title.includes('milestones')) {
    // Attempt to parse timeline content into a table
    const tableData = tryParseTable(cleanContent, ['Phase', 'Timeline', 'Deliverables']);
    if (tableData) {
      blocks.push({ id: uuidv4(), type: 'table', content: tableData });
    } else {
      blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    }
  } else if (title.includes('pricing') || title.includes('cost') || title.includes('budget') || title.includes('fee')) {
    const tableData = tryParseTable(cleanContent, ['Item', 'Description', 'Cost']);
    if (tableData) {
      blocks.push({ id: uuidv4(), type: 'table', content: tableData });
    } else {
      blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    }
  } else if (title.includes('case stud') || title.includes('experience') || title.includes('past performance')) {
    const lines = cleanContent.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      blocks.push({ id: uuidv4(), type: 'quote', content: { text: lines[0], attribution: '' } });
      blocks.push({ id: uuidv4(), type: 'text', content: { text: lines.slice(1).join('\n') } });
    } else {
      blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    }
    const imageQuery = extractImageQuery(sectionTitle, cleanContent);
    blocks.push({ id: uuidv4(), type: 'image', content: { url: '', caption: '', suggestedImageQuery: imageQuery } });
  } else if (title.includes('methodology') || title.includes('approach') || title.includes('process')) {
    blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    const imageQuery = extractImageQuery(sectionTitle, cleanContent);
    blocks.push({ id: uuidv4(), type: 'image', content: { url: '', caption: '', suggestedImageQuery: imageQuery } });
    blocks.push({ id: uuidv4(), type: 'divider', content: {} });
  } else if (title.includes('team') || title.includes('personnel') || title.includes('staff')) {
    blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    const imageQuery = extractImageQuery(sectionTitle, cleanContent);
    blocks.push({ id: uuidv4(), type: 'image', content: { url: '', caption: '', suggestedImageQuery: imageQuery } });
  } else if (title.includes('solution') || title.includes('overview') || title.includes('company')) {
    blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    // Add a suggested image block for visual sections
    const imageQuery = extractImageQuery(sectionTitle, cleanContent);
    blocks.push({ id: uuidv4(), type: 'image', content: { url: '', caption: '', suggestedImageQuery: imageQuery } });
  } else if (title.includes('conclusion') || title.includes('closing') || title.includes('next steps')) {
    const firstLine = cleanContent.split('\n')[0] || '';
    if (firstLine) {
      blocks.push({ id: uuidv4(), type: 'callout', content: { text: firstLine, style: 'success' } });
      const rest = cleanContent.split('\n').slice(1).join('\n').trim();
      if (rest) {
        blocks.push({ id: uuidv4(), type: 'text', content: { text: rest } });
      }
    } else {
      blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
    }
  } else {
    // Default: heading + text
    blocks.push({ id: uuidv4(), type: 'text', content: { text: cleanContent } });
  }

  return blocks;
}

function tryParseTable(content: string | null, defaultHeaders: string[]): Record<string, unknown> | null {
  if (!content) return null;
  // Check if content has markdown table or structured list patterns
  const lines = content.split('\n').filter(l => l.trim());
  const pipeLines = lines.filter(l => l.includes('|'));
  
  if (pipeLines.length >= 2) {
    // Parse markdown table
    const headerLine = pipeLines[0];
    const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
    const dataRows = pipeLines.slice(1).filter(l => !l.match(/^[\s|:-]+$/));
    const rows = dataRows.map(row => row.split('|').map(c => c.trim()).filter(Boolean));
    return { headers, rows };
  }

  return null;
}

function extractImageQuery(title: string, content: string | null): string {
  // Generate a Pexels search query from section context
  const keywords = title.replace(/[^a-zA-Z\s]/g, '').trim();
  const contentWords = (content || '').slice(0, 200).replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const topWords = contentWords.slice(0, 3).join(' ');
  return `${keywords} ${topWords}`.trim().slice(0, 60) || 'professional business';
}

const MAX_AUTO_IMAGES = 6;

async function autoPopulateImages(blocks: ContentBlock[]): Promise<ContentBlock[]> {
  const imageBlocks = blocks.filter(
    b => b.type === 'image' && (b.content as any).suggestedImageQuery && !(b.content as any).url
  );

  const toFetch = imageBlocks.slice(0, MAX_AUTO_IMAGES);
  if (toFetch.length === 0) return blocks;

  const results = await Promise.allSettled(
    toFetch.map(block =>
      supabase.functions.invoke('search-stock-images', {
        body: { query: (block.content as any).suggestedImageQuery, per_page: 1 },
      })
    )
  );

  const updatedBlocks = [...blocks];
  toFetch.forEach((block, i) => {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value.data?.photos?.[0]) {
      const photo = result.value.data.photos[0];
      const idx = updatedBlocks.findIndex(b => b.id === block.id);
      if (idx !== -1) {
        updatedBlocks[idx] = {
          ...updatedBlocks[idx],
          content: {
            ...updatedBlocks[idx].content,
            url: photo.src.large,
            caption: `Photo by ${photo.photographer}`,
          },
        };
      }
    }
  });

  return updatedBlocks;
}

async function autoPopulateCoverImage(blocks: ContentBlock[], projectTitle: string): Promise<ContentBlock[]> {
  const coverIdx = blocks.findIndex(b => b.type === 'cover');
  if (coverIdx === -1 || (blocks[coverIdx].content as any).coverImageUrl) return blocks;

  try {
    const { data } = await supabase.functions.invoke('search-stock-images', {
      body: { query: `${projectTitle} professional business`, per_page: 1 },
    });
    if (data?.photos?.[0]) {
      const updated = [...blocks];
      updated[coverIdx] = {
        ...updated[coverIdx],
        content: { ...updated[coverIdx].content, coverImageUrl: data.photos[0].src.large },
      };
      return updated;
    }
  } catch (e) {
    console.warn('Failed to auto-populate cover image:', e);
  }
  return blocks;
}

export function useProposalDesign(projectId: string): UseProposalDesignReturn {
  const { session } = useAuth();
  const [design, setDesign] = useState<ProposalDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [missingSectionCount, setMissingSectionCount] = useState(0);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Undo/redo history
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback((blocks: ContentBlock[], settings: DesignSettings) => {
    if (skipHistoryRef.current) return;
    const idx = historyIndexRef.current;
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
          await createNewDesign();
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

  const createNewDesign = async () => {
    if (!session?.user) return;

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id, title, client_name')
      .eq('project_id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    const { data: sections } = await supabase
      .from('proposal_sections')
      .select('section_title, content, sort_order, created_at')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    const template = getTemplate('sterling');

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

    // Use smart layout engine for block generation
    const blocks: ContentBlock[] = [
      { id: uuidv4(), type: 'cover', content: { title: project.title || 'Proposal', subtitle: `Prepared for ${project.client_name || 'Client'}`, date: new Date().toLocaleDateString() } },
      { id: uuidv4(), type: 'toc', content: {} },
    ];

    if (sections && sections.length > 0) {
      for (const s of sections) {
        blocks.push(...mapSectionToBlocks(s.section_title, s.content || ''));
      }
    }

    // Auto-populate images from Pexels
    const populatedBlocks = await autoPopulateCoverImage(
      await autoPopulateImages(blocks),
      project.title || 'Proposal'
    );

    const newDesign = {
      project_id: projectId,
      organization_id: project.organization_id,
      user_id: session.user.id,
      template_id: template.id,
      design_settings: { ...template.defaults, headerStyle: template.headerStyle, coverLayout: template.coverLayout, ...brandOverrides },
      content_blocks: populatedBlocks,
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
  };

  // Regenerate design from current proposal sections
  const regenerateDesign = useCallback(async () => {
    if (!design || !session?.user) return;
    setIsRegenerating(true);
    try {
      const { data: sections } = await supabase
        .from('proposal_sections')
        .select('section_title, content, sort_order, created_at')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      const { data: project } = await supabase
        .from('projects')
        .select('title, client_name')
        .eq('project_id', projectId)
        .single();

      // Check for default brand guideline
      let brandOverrides: Partial<DesignSettings> = {};
      try {
        const { data: defaultGuideline } = await supabase
          .from('organization_brand_guidelines' as any)
          .select('*')
          .eq('organization_id', design.organization_id)
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
        console.warn('Could not load brand guideline:', e);
      }

      const template = getTemplate(design.template_id);
      const newSettings = { ...template.defaults, headerStyle: template.headerStyle, coverLayout: template.coverLayout, ...brandOverrides };

      const blocks: ContentBlock[] = [
        { id: uuidv4(), type: 'cover', content: { title: project?.title || 'Proposal', subtitle: `Prepared for ${project?.client_name || 'Client'}`, date: new Date().toLocaleDateString() } },
        { id: uuidv4(), type: 'toc', content: {} },
      ];

      if (sections && sections.length > 0) {
        for (const s of sections) {
          blocks.push(...mapSectionToBlocks(s.section_title, s.content || ''));
        }
      }

      // Auto-populate images from Pexels
      const populatedBlocks = await autoPopulateCoverImage(
        await autoPopulateImages(blocks),
        project?.title || 'Proposal'
      );

      pushHistory(populatedBlocks, newSettings);
      setDesign(prev => prev ? { ...prev, content_blocks: populatedBlocks, design_settings: newSettings } : null);
      dirtyRef.current = true;
      toast.success('Design regenerated from proposal content');
    } catch (err) {
      console.error('Regenerate failed:', err);
      toast.error('Failed to regenerate design');
    } finally {
      setIsRegenerating(false);
    }
  }, [design, projectId, session, pushHistory]);

  // Detect drift between proposal_sections and the design's heading blocks
  useEffect(() => {
    if (!design || !projectId) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('proposal_sections')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      if (cancelled || count == null) return;
      const headingCount = (design.content_blocks || []).filter(
        b => b.type === 'heading' && ((b.content as any)?.level ?? 2) === 2
      ).length;
      setMissingSectionCount(Math.max(0, count - headingCount));
    })();
    return () => { cancelled = true; };
    // Only recheck when the design's identity or section count shape changes — not on every edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.id, projectId]);

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

  return { design, isLoading, isSaving, isRegenerating, missingSectionCount, canUndo, canRedo, updateBlocks, updateSettings, updateTemplateId, saveNow, undo, redo, regenerateDesign };
}
