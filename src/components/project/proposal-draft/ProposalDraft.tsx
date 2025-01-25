import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProposalSections } from "./useProposalSections";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
}

export function ProposalDraft({ projectId, outline }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const { sections, isLoading, error, addSection } = useProposalSections(projectId);

  const handleAddSection = () => {
    const title = prompt("Enter section title:");
    if (title) {
      addSection(title);
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2">
              <CardTitle>Proposal Draft</CardTitle>
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
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}