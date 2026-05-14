import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, Eye, Edit, Undo2, Redo2, Wand2, RefreshCw, Sparkles } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CanvasEditor } from './canvas/CanvasEditor';
import { makeBlankDocument } from './canvas/elementFactory';
import { blocksToCanvasDocument } from './canvas/autoLayout';
import { CanvasDocument } from './canvas/types';
import { toast } from 'sonner';

interface ProposalDesignStudioProps {
  projectId: string;
}

export function ProposalDesignStudio({ projectId }: ProposalDesignStudioProps) {
  const { design, isLoading, isSaving, isRegenerating, missingSectionCount, canUndo, canRedo, updateBlocks, updateSettings, updateTemplateId, saveNow, undo, redo, regenerateDesign } = useProposalDesign(projectId);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [showClassic, setShowClassic] = useState(false);
  const autoImportedRef = useRef(false);

  const handleScrollTo = useCallback((blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleCanvasChange = useCallback((doc: CanvasDocument) => {
    if (!design) return;
    updateSettings({ ...design.design_settings, schemaVersion: 2, canvasDocument: doc });
  }, [design, updateSettings]);

  // Auto-import proposal into canvas on first load (no manual step required)
  useEffect(() => {
    if (!design || autoImportedRef.current) return;
    if (design.design_settings.canvasDocument) {
      autoImportedRef.current = true;
      return;
    }
    autoImportedRef.current = true;
    const doc = design.content_blocks?.length
      ? blocksToCanvasDocument(design.content_blocks, design.design_settings)
      : makeBlankDocument();
    updateSettings({ ...design.design_settings, schemaVersion: 2, canvasDocument: doc });
    if (design.content_blocks?.length) {
      toast.success('Proposal imported — drag any element to edit');
    }
  }, [design, updateSettings]);

  const reimportFromProposal = useCallback(() => {
    if (!design) return;
    const doc = design.content_blocks?.length
      ? blocksToCanvasDocument(design.content_blocks, design.design_settings)
      : makeBlankDocument();
    updateSettings({ ...design.design_settings, schemaVersion: 2, canvasDocument: doc });
    toast.success('Re-imported the latest proposal content');
  }, [design, updateSettings]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    if (!design || templateId === design.template_id) return;
    updateTemplateId(templateId);
    toast.success('Template applied');
  }, [design, updateTemplateId]);

  if (isLoading || !design) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCanvasMode = !showClassic && (design.design_settings.schemaVersion === 2 || !!design.design_settings.canvasDocument);


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Proposal Design Studio</h2>
          <p className="text-sm text-muted-foreground">
            {isCanvasMode ? 'Canvas mode — click any element to edit' : 'Design and export your proposal document'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isCanvasMode ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 mr-2" disabled={isRegenerating}>
                    {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Re-import from Proposal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Re-import the latest proposal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This replaces every page on the canvas with a fresh layout built from your current proposal sections. Any visual edits you've made on the canvas will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={reimportFromProposal}>Re-import</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="sm" className="mr-2" onClick={() => setShowClassic(true)}>
                Classic view
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" className="gap-1.5 mr-2" onClick={() => setShowClassic(false)}>
                Back to Canvas
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 mr-2" disabled={isRegenerating}>
                    {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Regenerate Design
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Design?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace all current design blocks with a fresh layout generated from your proposal content and brand guidelines. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={regenerateDesign}>Regenerate</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                <Redo2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <ExportPanel designId={design.id} isSaving={isSaving} onSave={saveNow} />
        </div>
      </div>

      {isCanvasMode ? (
        <CanvasEditor
          document={design.design_settings.canvasDocument ?? makeBlankDocument()}
          organizationId={design.organization_id}
          onChange={handleCanvasChange}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
