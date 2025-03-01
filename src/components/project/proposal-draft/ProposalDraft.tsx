
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { CompiledView } from "./components/CompiledView";
import { useProposalSections } from "./useProposalSections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupManager } from "./BackupManager";

export interface ProposalDraftProps {
  projectId: string;
  mode?: "draft" | "compiled";
}

export function ProposalDraft({ projectId, mode = "draft" }: ProposalDraftProps) {
  // Set the active tab based on the mode prop
  const [activeTab, setActiveTab] = useState<string>(mode === "compiled" ? "preview" : "sections");
  const {
    sections,
    isLoading,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
  } = useProposalSections(projectId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-2xl font-semibold">Proposal Draft</CardTitle>
          <CardDescription>
            Create and edit sections for your proposal
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <BackupManager sections={sections} projectId={projectId} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pb-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sections" className="p-6 pt-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <AddSectionButton onAdd={addSection} />
                
                <SectionsList
                  sections={sections}
                  selectedSection={null}
                  onSelectSection={() => {}}
                  onReorderSections={reorderSections}
                  isLoading={isLoading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="border-none p-0">
            <CompiledView sections={sections} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ProposalDraft;
