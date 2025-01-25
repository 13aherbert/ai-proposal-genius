import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProposalSections } from "./useProposalSections";
import { SectionEditor } from "./SectionEditor";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
}

export function ProposalDraft({ projectId, outline }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const { sections, isLoading, error, addSection } = useProposalSections(projectId);

  const handleAddSection = () => {
    const title = prompt("Enter section title:");
    if (title) {
      addSection(title);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Proposal Draft</CardTitle>
          <Button onClick={handleAddSection} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div>Loading sections...</div>
        ) : error ? (
          <div className="text-red-500">Error loading sections: {error.message}</div>
        ) : sections.length === 0 ? (
          <div className="text-muted-foreground">
            No sections yet. Click "Add Section" to start drafting your proposal.
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                isSelected={selectedSection === section.id}
                onSelect={() => setSelectedSection(section.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}