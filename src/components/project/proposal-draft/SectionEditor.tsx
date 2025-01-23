import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { useProposalSections, ProposalSection } from "./useProposalSections";

interface SectionEditorProps {
  section: ProposalSection;
  isSelected: boolean;
  onSelect: () => void;
}

export function SectionEditor({ section, isSelected, onSelect }: SectionEditorProps) {
  const [content, setContent] = useState(section.content || "");
  const { updateSection } = useProposalSections(section.project_id);

  const handleSave = () => {
    updateSection(section.id, content);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{section.section_title}</CardTitle>
          <Button variant="ghost" size="sm">
            {isSelected ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isSelected && (
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content here..."
            className="min-h-[200px]"
          />
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      )}
    </Card>
  );
}