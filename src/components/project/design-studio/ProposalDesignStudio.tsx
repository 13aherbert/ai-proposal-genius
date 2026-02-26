import { useState, useCallback } from 'react';
import { Loader2, Eye, Edit } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useProposalDesign } from './useProposalDesign';
import { TemplateSelector } from './TemplateSelector';
import { BrandingCustomizer } from './BrandingCustomizer';
import { BlockEditor } from './BlockEditor';
import { ProposalPreview } from './ProposalPreview';
import { ExportPanel } from './ExportPanel';
import { ProposalOutlineSidebar } from './ProposalOutlineSidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ProposalDesignStudioProps {
  projectId: string;
}

export function ProposalDesignStudio({ projectId }: ProposalDesignStudioProps) {
  const { design, isLoading, isSaving, updateBlocks, updateSettings, updateTemplateId, saveNow } = useProposalDesign(projectId);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);

  const handleScrollTo = useCallback((blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (isLoading || !design) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Proposal Design Studio</h2>
          <p className="text-sm text-muted-foreground">Design and export your proposal document</p>
        </div>
        <ExportPanel designId={design.id} isSaving={isSaving} onSave={saveNow} />
      </div>

      {/* Template Selector (collapsible) */}
      <Collapsible open={templateOpen} onOpenChange={setTemplateOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
            <ChevronDown className={`h-4 w-4 transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
            Template
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <TemplateSelector selectedId={design.template_id} onSelect={updateTemplateId} />
        </CollapsibleContent>
      </Collapsible>

      {/* Branding (collapsible) */}
      <Collapsible open={brandingOpen} onOpenChange={setBrandingOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
            <ChevronDown className={`h-4 w-4 transition-transform ${brandingOpen ? 'rotate-180' : ''}`} />
            Branding & Style
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <BrandingCustomizer settings={design.design_settings} onChange={updateSettings} organizationId={design.organization_id} />
        </CollapsibleContent>
      </Collapsible>

      {/* Editor / Preview tabs */}
      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor" className="gap-1"><Edit className="h-3.5 w-3.5" /> Editor</TabsTrigger>
          <TabsTrigger value="preview" className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="pt-4">
          <div className="flex gap-4">
            <div className="w-48 shrink-0 hidden md:block">
              <ProposalOutlineSidebar blocks={design.content_blocks} onScrollTo={handleScrollTo} />
            </div>
            <div className="flex-1 min-w-0">
              <BlockEditor
                blocks={design.content_blocks}
                settings={design.design_settings}
                organizationId={design.organization_id}
                onChange={updateBlocks}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          <ProposalPreview blocks={design.content_blocks} settings={design.design_settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
