import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './use-current-organization';
import { DesignSettings, HeaderStyle, CoverLayout } from '@/components/project/design-studio/types';
import { toast } from 'sonner';

export interface BrandGuideline {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  header_font: string;
  body_font: string;
  header_style: string;
  cover_layout: string;
  margins: string;
  section_numbering: boolean;
  created_at: string;
  updated_at: string;
}

export type BrandGuidelineInput = Omit<BrandGuideline, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;

function guidelineToDesignSettings(g: BrandGuideline): Partial<DesignSettings> {
  return {
    primaryColor: g.primary_color,
    secondaryColor: g.secondary_color,
    headerFont: g.header_font,
    bodyFont: g.body_font,
    headerStyle: g.header_style as HeaderStyle,
    coverLayout: g.cover_layout as CoverLayout,
    margins: g.margins as DesignSettings['margins'],
    sectionNumbering: g.section_numbering,
    logoUrl: g.logo_url ?? undefined,
  };
}

export function designSettingsToGuidelineInput(settings: DesignSettings, name: string, isDefault: boolean): BrandGuidelineInput {
  return {
    name,
    is_default: isDefault,
    logo_url: settings.logoUrl ?? null,
    primary_color: settings.primaryColor,
    secondary_color: settings.secondaryColor,
    header_font: settings.headerFont,
    body_font: settings.bodyFont,
    header_style: settings.headerStyle || 'accent-bar',
    cover_layout: settings.coverLayout || 'centered',
    margins: settings.margins,
    section_numbering: settings.sectionNumbering ?? false,
  };
}

export function useBrandGuidelines() {
  const { organization } = useCurrentOrganization();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const queryKey = ['brand-guidelines', orgId];

  const { data: guidelines = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_brand_guidelines' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as any[]) as BrandGuideline[];
    },
    enabled: !!orgId,
  });

  const defaultGuideline = guidelines.find(g => g.is_default) ?? null;

  const saveMutation = useMutation({
    mutationFn: async (input: BrandGuidelineInput) => {
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('organization_brand_guidelines' as any)
        .insert({ ...input, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Brand guideline saved');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save guideline'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: BrandGuidelineInput & { id: string }) => {
      const { error } = await supabase
        .from('organization_brand_guidelines' as any)
        .update(input as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Brand guideline updated');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update guideline'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_brand_guidelines' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Brand guideline deleted');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete guideline'),
  });

  return {
    guidelines,
    isLoading,
    defaultGuideline,
    guidelineToDesignSettings,
    saveGuideline: saveMutation.mutateAsync,
    updateGuideline: updateMutation.mutateAsync,
    deleteGuideline: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending || updateMutation.isPending,
  };
}
