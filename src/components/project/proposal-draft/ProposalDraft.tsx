import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProposalSections } from "./useProposalSections";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { CompiledView } from "./components/CompiledView";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
}

export function ProposalDraft({ projectId, outline }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { sections, isLoading, error, addSection, reorderSections } = useProposalSections(projectId);

  const handleAddSection = () => {
    const title = prompt("Enter section title:");
    if (title) {
      addSection(title);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2">
                <div>
                  <CardTitle>Proposal Draft</CardTitle>
                  <CardDescription>Write and organize your proposal sections</CardDescription>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <AddSectionButton onAdd={handleAddSection} />
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SectionsList
                sections={sections}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
                onReorderSections={reorderSections}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {sections.length > 0 && <CompiledView sections={sections} />}
    </div>
  );
}